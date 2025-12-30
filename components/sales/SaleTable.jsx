'use client';

import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function SaleTable({ sales, onEdit, onRefresh }) {
  const columns = [
    {
      header: 'Customer',
      cell: (row) => row.customer_name || '-',
    },
    {
      header: 'Vehicle',
      cell: (row) => row.vehicle_info || '-',
    },
    {
      header: 'Sale Price',
      cell: (row) => `$${parseFloat(row.sale_price || 0).toLocaleString()}`,
    },
    {
      header: 'Payment Method',
      accessorKey: 'payment_method',
    },
    {
      header: 'Sale Date',
      cell: (row) => formatDate(row.sale_date),
    },
    {
      header: 'Status',
      cell: (row) => {
        const variant = row.status === 'Completed' ? 'default' : 
                       row.status === 'Cancelled' ? 'destructive' : 'secondary';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
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

  return <DataTable columns={columns} data={sales} onRowClick={onEdit} />;
}