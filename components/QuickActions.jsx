'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, MessageSquare } from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Add Lead',
      icon: Plus,
      onClick: () => router.push('/leads'),
      color: 'blue',
    },
    {
      label: 'Schedule Service',
      icon: Calendar,
      onClick: () => router.push('/service/appointments'),
      color: 'green',
    },
    {
      label: 'Create Task',
      icon: FileText,
      onClick: () => router.push('/tasks'),
      color: 'orange',
    },
    {
      label: 'Send Message',
      icon: MessageSquare,
      onClick: () => router.push('/messages'),
      color: 'purple',
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={action.onClick}
              className="h-auto flex-col gap-2 py-4"
            >
              <action.icon className={`h-6 w-6 text-${action.color}-600`} />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}