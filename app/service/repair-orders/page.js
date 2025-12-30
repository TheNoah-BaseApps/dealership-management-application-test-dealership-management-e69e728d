'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RepairOrderForm from '@/components/service/RepairOrderForm';
import RepairOrderTable from '@/components/service/RepairOrderTable';
import SearchFilter from '@/components/SearchFilter';
import { Plus, Wrench, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function RepairOrdersPage() {
  const [repairOrders, setRepairOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchRepairOrders();
  }, [filters]);

  const fetchRepairOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/repair-orders?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch repair orders');

      const data = await response.json();
      setRepairOrders(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load repair orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchRepairOrders();
    toast.success('Repair order created successfully');
  };

  const totalRevenue = repairOrders.reduce((sum, ro) => sum + (parseFloat(ro.total_cost) || 0), 0);
  const avgCost = repairOrders.length > 0 ? totalRevenue / repairOrders.length : 0;

  const stats = [
    { label: 'Total Orders', value: repairOrders.length, icon: Wrench, color: 'blue' },
    { 
      label: 'In Progress', 
      value: repairOrders.filter(ro => ro.status === 'In Progress').length, 
      icon: Clock, 
      color: 'orange' 
    },
    { 
      label: 'Completed', 
      value: repairOrders.filter(ro => ro.status === 'Completed').length, 
      icon: CheckCircle, 
      color: 'green' 
    },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Repair Orders</h1>
          <p className="text-slate-600">Track and manage repair work orders</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Repair Order
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
          { value: 'In Progress', label: 'In Progress' },
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
        <RepairOrderTable
          repairOrders={repairOrders}
          onRefresh={fetchRepairOrders}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Repair Order</DialogTitle>
          </DialogHeader>
          <RepairOrderForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}