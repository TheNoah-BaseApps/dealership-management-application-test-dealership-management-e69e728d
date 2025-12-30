'use client';

import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';

export default function AppointmentTable({ appointments, onRefresh }) {
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
      header: 'Service Type',
      accessorKey: 'service_type',
    },
    {
      header: 'Appointment Date',
      cell: (row) => formatDate(row.appointment_date),
    },
    {
      header: 'Technician',
      cell: (row) => row.technician_name || '-',
    },
    {
      header: 'Estimated Cost',
      cell: (row) => row.estimated_cost ? `$${parseFloat(row.estimated_cost).toLocaleString()}` : '-',
    },
    {
      header: 'Status',
      cell: (row) => {
        const variant = row.status === 'Completed' ? 'default' : 
                       row.status === 'Cancelled' ? 'destructive' : 'secondary';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return <DataTable columns={columns} data={appointments} />;
}