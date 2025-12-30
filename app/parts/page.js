'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PartForm from '@/components/parts/PartForm';
import PartTable from '@/components/parts/PartTable';
import SearchFilter from '@/components/SearchFilter';
import { Plus, Package, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function PartsPage() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({ search: '' });

  useEffect(() => {
    fetchParts();
  }, [filters]);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/parts?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch parts');

      const data = await response.json();
      setParts(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load parts inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchParts();
    toast.success('Part added successfully');
  };

  const lowStockParts = parts.filter(p => p.quantity <= p.min_quantity);
  const totalValue = parts.reduce((sum, p) => sum + (p.quantity * parseFloat(p.unit_price || 0)), 0);

  const stats = [
    { label: 'Total Parts', value: parts.length, icon: Package, color: 'blue' },
    { label: 'Low Stock', value: lowStockParts.length, icon: AlertTriangle, color: 'orange' },
    { label: 'Inventory Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'green' },
    { 
      label: 'Out of Stock', 
      value: parts.filter(p => p.quantity === 0).length, 
      icon: TrendingDown, 
      color: 'red' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Parts Inventory</h1>
          <p className="text-slate-600">Manage parts stock and track inventory levels</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Part
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

      {lowStockParts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lowStockParts.length} part(s) are running low on stock and need reordering.
          </AlertDescription>
        </Alert>
      )}

      <SearchFilter
        filters={filters}
        onFilterChange={setFilters}
        showStatus={false}
      />

      {loading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <PartTable
          parts={parts}
          onRefresh={fetchParts}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
          </DialogHeader>
          <PartForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}