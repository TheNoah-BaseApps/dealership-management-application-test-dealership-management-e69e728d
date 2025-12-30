'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SaleForm from '@/components/sales/SaleForm';
import SaleTable from '@/components/sales/SaleTable';
import SaleDetailsDialog from '@/components/sales/SaleDetailsDialog';
import SearchFilter from '@/components/SearchFilter';
import { Plus, DollarSign, TrendingUp, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/sales?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch sales');

      const data = await response.json();
      setSales(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchSales();
    toast.success('Sale recorded successfully');
  };

  const handleEdit = (sale) => {
    setSelectedSale(sale);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.sale_price) || 0), 0);
  const monthSales = sales.filter(s => {
    const saleDate = new Date(s.sale_date);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  });
  const monthRevenue = monthSales.reduce((sum, s) => sum + (parseFloat(s.sale_price) || 0), 0);

  const stats = [
    { label: 'Total Sales', value: sales.length, icon: CheckCircle, color: 'blue' },
    { label: 'This Month', value: monthSales.length, icon: Calendar, color: 'green' },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'purple' },
    { label: 'Monthly Revenue', value: `$${monthRevenue.toLocaleString()}`, icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Management</h1>
          <p className="text-slate-600">Track and manage vehicle sales</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SearchFilter
        filters={filters}
        onFilterChange={setFilters}
        statusOptions={[
          { value: '', label: 'All Status' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Cancelled', label: 'Cancelled' },
        ]}
      />

      {loading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <SaleTable
          sales={sales}
          onEdit={handleEdit}
          onRefresh={fetchSales}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>
          <SaleForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>

      {selectedSale && (
        <SaleDetailsDialog
          sale={selectedSale}
          open={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdate={fetchSales}
        />
      )}
    </div>
  );
}