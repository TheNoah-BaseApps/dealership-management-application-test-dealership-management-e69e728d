'use client';

import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';

export default function PartTable({ parts, onRefresh }) {
  const columns = [
    {
      header: 'Part Name',
      accessorKey: 'part_name',
    },
    {
      header: 'Part Number',
      accessorKey: 'part_number',
    },
    {
      header: 'Category',
      cell: (row) => row.category || '-',
    },
    {
      header: 'Quantity',
      cell: (row) => {
        const isLow = row.quantity <= row.min_quantity;
        return (
          <span className={isLow ? 'text-orange-600 font-medium' : ''}>
            {row.quantity}
          </span>
        );
      },
    },
    {
      header: 'Min Qty',
      accessorKey: 'min_quantity',
    },
    {
      header: 'Unit Price',
      cell: (row) => `$${parseFloat(row.unit_price || 0).toLocaleString()}`,
    },
    {
      header: 'Total Value',
      cell: (row) => {
        const total = row.quantity * parseFloat(row.unit_price || 0);
        return `$${total.toLocaleString()}`;
      },
    },
    {
      header: 'Status',
      cell: (row) => {
        if (row.quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (row.quantity <= row.min_quantity) return <Badge variant="secondary">Low Stock</Badge>;
        return <Badge>In Stock</Badge>;
      },
    },
    {
      header: 'Location',
      cell: (row) => row.location || '-',
    },
  ];

  return <DataTable columns={columns} data={parts} />;
}