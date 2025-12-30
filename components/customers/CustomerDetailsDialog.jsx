'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerForm from './CustomerForm';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function CustomerDetailsDialog({ customer, open, onClose, onUpdate }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer?.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{customer?.phone}</span>
              </div>
              {customer?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{customer?.email}</span>
                </div>
              )}
              {customer?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p>{customer?.address}</p>
                    {customer?.city && customer?.state && (
                      <p>
                        {customer?.city}, {customer?.state} {customer?.zip}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-slate-500">Total Purchases</p>
                <p className="text-2xl font-bold">{customer?.purchase_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Service Visits</p>
                <p className="text-2xl font-bold">{customer?.service_count || 0}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <CustomerForm customer={customer} onSuccess={() => { onUpdate(); onClose(); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}