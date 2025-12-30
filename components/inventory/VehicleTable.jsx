'use client';

import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function VehicleTable({ vehicles, onEdit, onDelete, onRefresh }) {
  const columns = [
    {
      header: 'Vehicle',
      cell: (row) => `${row.year} ${row.make} ${row.model}`,
    },
    {
      header: 'VIN',
      accessorKey: 'vin_number',
    },
    {
      header: 'Color',
      accessorKey: 'color',
    },
    {
      header: 'Mileage',
      cell: (row) => row.mileage ? `${row.mileage.toLocaleString()} mi` : '-',
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.stock_status} type="vehicle" />,
    },
    {
      header: 'Purchase Price',
      cell: (row) => `$${parseFloat(row.purchase_price || 0).toLocaleString()}`,
    },
    {
      header: 'List Price',
      cell: (row) => `$${parseFloat(row.list_price || 0).toLocaleString()}`,
    },
    {
      header: 'Location',
      cell: (row) => row.location || '-',
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

  return <DataTable columns={columns} data={vehicles} onRowClick={onEdit} />;
}