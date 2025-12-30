'use client';

import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Edit, Phone, Mail, MapPin } from 'lucide-react';

export default function CustomerTable({ customers, onEdit, onRefresh }) {
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Contact',
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-slate-400" />
            {row.phone}
          </div>
          {row.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-3 w-3 text-slate-400" />
              {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (row) => row.city && row.state ? (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          {row.city}, {row.state}
        </div>
      ) : '-',
    },
    {
      header: 'Purchases',
      cell: (row) => row.purchase_count || 0,
    },
    {
      header: 'Service Visits',
      cell: (row) => row.service_count || 0,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return <DataTable columns={columns} data={customers} onRowClick={onEdit} />;
}