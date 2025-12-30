'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SaleForm from './SaleForm';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';

export default function SaleDetailsDialog({ sale, open, onClose, onUpdate }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details - {sale?.sale_id}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <p className="font-medium">{sale?.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Vehicle</p>
                <p className="font-medium">{sale?.vehicle_info}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Sale Price</p>
                <p className="font-medium text-green-600 text-lg">
                  ${parseFloat(sale?.sale_price || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Payment Method</p>
                <p className="font-medium">{sale?.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Sale Date</p>
                <p className="font-medium">{formatDate(sale?.sale_date)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge>{sale?.status}</Badge>
              </div>
              {sale?.trade_in_value && (
                <div>
                  <p className="text-sm text-slate-500">Trade-In Value</p>
                  <p className="font-medium">${parseFloat(sale?.trade_in_value).toLocaleString()}</p>
                </div>
              )}
            </div>
            {sale?.finance_terms && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Finance Terms</p>
                <p className="text-sm">{sale?.finance_terms}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit">
            <SaleForm sale={sale} onSuccess={() => { onUpdate(); onClose(); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}