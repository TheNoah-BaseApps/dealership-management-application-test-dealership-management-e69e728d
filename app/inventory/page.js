'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VehicleForm from '@/components/inventory/VehicleForm';
import VehicleTable from '@/components/inventory/VehicleTable';
import VehicleDetailsDialog from '@/components/inventory/VehicleDetailsDialog';
import SearchFilter from '@/components/SearchFilter';
import { Plus, Car, Package, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/vehicles?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch vehicles');

      const data = await response.json();
      setVehicles(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchVehicles();
    toast.success('Vehicle added successfully');
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete vehicle');

      fetchVehicles();
      toast.success('Vehicle removed successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const totalValue = vehicles.reduce((sum, v) => sum + (parseFloat(v.list_price) || 0), 0);
  const availableCount = vehicles.filter(v => v.stock_status === 'Available').length;
  const avgDaysInStock = vehicles.length > 0 
    ? Math.round(vehicles.reduce((sum, v) => {
        const days = Math.floor((new Date() - new Date(v.created_at)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / vehicles.length)
    : 0;

  const stats = [
    { label: 'Total Inventory', value: vehicles.length, icon: Car, color: 'blue' },
    { label: 'Available', value: availableCount, icon: Package, color: 'green' },
    { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'purple' },
    { label: 'Avg Days in Stock', value: avgDaysInStock, icon: Clock, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vehicle Inventory</h1>
          <p className="text-slate-600">Manage dealership vehicle stock</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
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
          { value: 'Available', label: 'Available' },
          { value: 'Reserved', label: 'Reserved' },
          { value: 'Sold', label: 'Sold' },
          { value: 'Delivered', label: 'Delivered' },
        ]}
      />

      {loading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <VehicleTable
          vehicles={vehicles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchVehicles}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Vehicle to Inventory</DialogTitle>
          </DialogHeader>
          <VehicleForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>

      {selectedVehicle && (
        <VehicleDetailsDialog
          vehicle={selectedVehicle}
          open={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onUpdate={fetchVehicles}
        />
      )}
    </div>
  );
}