'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LeadForm from '@/components/leads/LeadForm';
import LeadTable from '@/components/leads/LeadTable';
import LeadDetailsDialog from '@/components/leads/LeadDetailsDialog';
import SearchFilter from '@/components/SearchFilter';
import { Plus, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/leads?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch leads');

      const data = await response.json();
      setLeads(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchLeads();
    toast.success('Lead created successfully');
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
  };

  const handleDelete = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete lead');

      fetchLeads();
      toast.success('Lead deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const stats = [
    { 
      label: 'Total Leads', 
      value: leads.length, 
      icon: Users, 
      color: 'blue' 
    },
    { 
      label: 'New', 
      value: leads.filter(l => l.lead_status === 'New').length, 
      icon: TrendingUp, 
      color: 'green' 
    },
    { 
      label: 'In Progress', 
      value: leads.filter(l => ['Contacted', 'Qualified', 'Negotiating'].includes(l.lead_status)).length, 
      icon: Clock, 
      color: 'orange' 
    },
    { 
      label: 'Converted', 
      value: leads.filter(l => l.lead_status === 'Won').length, 
      icon: CheckCircle, 
      color: 'purple' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
          <p className="text-slate-600">Track and manage customer leads</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
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
          { value: 'New', label: 'New' },
          { value: 'Contacted', label: 'Contacted' },
          { value: 'Qualified', label: 'Qualified' },
          { value: 'Negotiating', label: 'Negotiating' },
          { value: 'Won', label: 'Won' },
          { value: 'Lost', label: 'Lost' },
        ]}
      />

      {loading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <LeadTable
          leads={leads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchLeads}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <LeadForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>

      {selectedLead && (
        <LeadDetailsDialog
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={fetchLeads}
        />
      )}
    </div>
  );
}