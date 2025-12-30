'use client';

import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function LeadTable({ leads, onEdit, onDelete, onRefresh }) {
  const columns = [
    {
      header: 'Contact Name',
      accessorKey: 'contact_name',
    },
    {
      header: 'Phone',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          {row.contact_phone}
        </div>
      ),
    },
    {
      header: 'Email',
      cell: (row) => row.contact_email ? (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          {row.contact_email}
        </div>
      ) : '-',
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.lead_status} type="lead" />,
    },
    {
      header: 'Source',
      accessorKey: 'lead_source',
    },
    {
      header: 'Vehicle Interest',
      cell: (row) => row.vehicle_interested || '-',
    },
    {
      header: 'Inquiry Date',
      cell: (row) => formatDate(row.inquiry_date),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={leads} onRowClick={onEdit} />;
}