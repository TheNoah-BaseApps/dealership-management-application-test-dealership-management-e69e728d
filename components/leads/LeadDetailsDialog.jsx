'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadForm from './LeadForm';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/date';
import { Phone, Mail, Calendar, DollarSign } from 'lucide-react';

export default function LeadDetailsDialog({ lead, open, onClose, onUpdate }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details - {lead?.contact_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <StatusBadge status={lead?.lead_status} type="lead" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Source</p>
                <p className="font-medium">{lead?.lead_source}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{lead?.contact_phone}</span>
              </div>
              {lead?.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{lead?.contact_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Inquiry: {formatDate(lead?.inquiry_date)}</span>
              </div>
              {lead?.follow_up_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Follow-up: {formatDate(lead?.follow_up_date)}</span>
                </div>
              )}
              {lead?.estimated_value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span>Est. Value: ${parseFloat(lead?.estimated_value).toLocaleString()}</span>
                </div>
              )}
            </div>

            {lead?.vehicle_interested && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Vehicle of Interest</p>
                <p className="font-medium">{lead?.vehicle_interested}</p>
              </div>
            )}

            {lead?.notes && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Notes</p>
                <p className="text-sm">{lead?.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit">
            <LeadForm lead={lead} onSuccess={() => { onUpdate(); onClose(); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}