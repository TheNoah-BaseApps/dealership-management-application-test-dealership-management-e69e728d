'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehicleForm from './VehicleForm';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/date';

export default function VehicleDetailsDialog({ vehicle, open, onClose, onUpdate }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle?.year} {vehicle?.make} {vehicle?.model}
          </DialogTitle>
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
                <StatusBadge status={vehicle?.stock_status} type="vehicle" />
              </div>
              <div>
                <p className="text-sm text-slate-500">VIN</p>
                <p className="font-medium font-mono text-sm">{vehicle?.vin_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Color</p>
                <p className="font-medium">{vehicle?.color}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mileage</p>
                <p className="font-medium">{vehicle?.mileage?.toLocaleString()} mi</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Purchase Price</p>
                <p className="font-medium">${parseFloat(vehicle?.purchase_price || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">List Price</p>
                <p className="font-medium text-green-600">${parseFloat(vehicle?.list_price || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium">{vehicle?.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Purchase Date</p>
                <p className="font-medium">{formatDate(vehicle?.purchase_date)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <VehicleForm vehicle={vehicle} onSuccess={() => { onUpdate(); onClose(); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}