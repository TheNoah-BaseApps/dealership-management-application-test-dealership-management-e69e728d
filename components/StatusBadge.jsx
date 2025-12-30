'use client';

import { Badge } from '@/components/ui/badge';

export default function StatusBadge({ status, type = 'default' }) {
  const getVariant = () => {
    if (type === 'lead') {
      switch (status) {
        case 'New': return 'default';
        case 'Contacted': return 'secondary';
        case 'Qualified': return 'default';
        case 'Negotiating': return 'default';
        case 'Won': return 'default';
        case 'Lost': return 'destructive';
        default: return 'outline';
      }
    }

    if (type === 'vehicle') {
      switch (status) {
        case 'Available': return 'default';
        case 'Reserved': return 'secondary';
        case 'Sold': return 'default';
        case 'Delivered': return 'default';
        default: return 'outline';
      }
    }

    return 'default';
  };

  const getColor = () => {
    if (type === 'lead') {
      switch (status) {
        case 'Won': return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'Lost': return 'bg-red-100 text-red-800 hover:bg-red-100';
        default: return '';
      }
    }

    if (type === 'vehicle') {
      switch (status) {
        case 'Available': return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'Sold': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
        default: return '';
      }
    }

    return '';
  };

  return (
    <Badge variant={getVariant()} className={getColor()}>
      {status}
    </Badge>
  );
}