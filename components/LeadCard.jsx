'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import StatusBadge from '@/components/StatusBadge';

export default function LeadCard({ lead, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{lead.contact_name}</CardTitle>
          <StatusBadge status={lead.lead_status} type="lead" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="h-4 w-4" />
          <span>{lead.contact_phone}</span>
        </div>
        {lead.contact_email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="h-4 w-4" />
            <span>{lead.contact_email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>Inquiry: {formatDate(lead.inquiry_date)}</span>
        </div>
        {lead.vehicle_interested && (
          <div className="mt-2">
            <p className="text-sm font-medium">Interested in:</p>
            <p className="text-sm text-slate-600">{lead.vehicle_interested}</p>
          </div>
        )}
        {lead.estimated_value && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm font-medium">
              Est. Value: ${parseFloat(lead.estimated_value).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}