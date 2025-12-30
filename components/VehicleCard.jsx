'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, DollarSign, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import StatusBadge from '@/components/StatusBadge';

export default function VehicleCard({ vehicle, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </CardTitle>
          <StatusBadge status={vehicle.stock_status} type="vehicle" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Car className="h-4 w-4" />
          <span>VIN: {vehicle.vin_number}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-slate-500">Color</p>
            <p className="font-medium">{vehicle.color}</p>
          </div>
          <div>
            <p className="text-slate-500">Mileage</p>
            <p className="font-medium">{vehicle.mileage?.toLocaleString()} mi</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-sm text-slate-500">Purchase</p>
            <p className="font-medium">${parseFloat(vehicle.purchase_price || 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">List Price</p>
            <p className="font-medium text-green-600">${parseFloat(vehicle.list_price || 0).toLocaleString()}</p>
          </div>
        </div>
        {vehicle.location && (
          <p className="text-sm text-slate-600">Location: {vehicle.location}</p>
        )}
      </CardContent>
    </Card>
  );
}