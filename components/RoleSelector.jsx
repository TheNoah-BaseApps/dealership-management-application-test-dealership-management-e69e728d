'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roles = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'sales_manager', label: 'Sales Manager', description: 'View all sales data' },
  { value: 'sales_rep', label: 'Sales Representative', description: 'Manage own leads and sales' },
  { value: 'service_manager', label: 'Service Manager', description: 'Manage all service operations' },
  { value: 'technician', label: 'Technician', description: 'Handle assigned repairs' },
  { value: 'finance', label: 'Finance', description: 'Access financial data' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export default function RoleSelector({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            <div className="flex flex-col">
              <span className="font-medium">{role.label}</span>
              <span className="text-xs text-slate-500">{role.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}