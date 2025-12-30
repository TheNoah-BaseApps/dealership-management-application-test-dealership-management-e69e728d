'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppointmentForm from '@/components/service/AppointmentForm';
import AppointmentTable from '@/components/service/AppointmentTable';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import SearchFilter from '@/components/SearchFilter';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/service-appointments?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const data = await response.json();
      setAppointments(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchAppointments();
    toast.success('Appointment scheduled successfully');
  };

  const stats = [
    { 
      label: 'Total Appointments', 
      value: appointments.length, 
      icon: Calendar, 
      color: 'blue' 
    },
    { 
      label: 'Scheduled', 
      value: appointments.filter(a => a.status === 'Scheduled').length, 
      icon: Clock, 
      color: 'orange' 
    },
    { 
      label: 'Completed', 
      value: appointments.filter(a => a.status === 'Completed').length, 
      icon: CheckCircle, 
      color: 'green' 
    },
    { 
      label: 'Pending', 
      value: appointments.filter(a => a.status === 'Pending').length, 
      icon: AlertCircle, 
      color: 'yellow' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Service Appointments</h1>
          <p className="text-slate-600">Schedule and manage service appointments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>
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

      {viewMode === 'table' && (
        <>
          <SearchFilter
            filters={filters}
            onFilterChange={setFilters}
            statusOptions={[
              { value: '', label: 'All Status' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Scheduled', label: 'Scheduled' },
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
            <AppointmentTable
              appointments={appointments}
              onRefresh={fetchAppointments}
            />
          )}
        </>
      )}

      {viewMode === 'calendar' && (
        <AppointmentCalendar
          appointments={appointments}
          onRefresh={fetchAppointments}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Service Appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}