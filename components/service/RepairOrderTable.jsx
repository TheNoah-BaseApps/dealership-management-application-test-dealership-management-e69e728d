'use client';

import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';

export default function RepairOrderTable({ repairOrders, onRefresh }) {
  const columns = [
    {
      header: 'RO #',
      accessorKey: 'ro_id',
    },
    {
      header: 'Customer',
      cell: (row) => row.customer_name || '-',
    },
    {
      header: 'Vehicle',
      cell: (row) => row.vehicle_info || '-',
    },
    {
      header: 'Issue',
      cell: (row) => (
        <div className="max-w-xs truncate" title={row.issue_description}>
          {row.issue_description}
        </div>
      ),
    },
    {
      header: 'Total Cost',
      cell: (row) => `$${parseFloat(row.total_cost || 0).toLocaleString()}`,
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
      header: 'Created',
      cell: (row) => formatDate(row.created_at),
    },
  ];

  return <DataTable columns={columns} data={repairOrders} />;
}