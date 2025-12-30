'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, ShoppingCart } from 'lucide-react';

export default function CustomerCard({ customer, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <CardTitle className="text-lg">{customer.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="h-4 w-4" />
          <span>{customer.phone}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="h-4 w-4" />
            <span>{customer.email}</span>
          </div>
        )}
        {customer.city && customer.state && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            <span>
              {customer.city}, {customer.state}
            </span>
          </div>
        )}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              {customer.purchase_count || 0} Purchase{customer.purchase_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}