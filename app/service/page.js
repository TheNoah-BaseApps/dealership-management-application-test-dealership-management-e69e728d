'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Wrench, FileText, ArrowRight } from 'lucide-react';

export default function ServicePage() {
  const router = useRouter();

  const serviceModules = [
    {
      title: 'Service Appointments',
      description: 'Schedule and manage customer service appointments',
      icon: Calendar,
      color: 'blue',
      path: '/service/appointments',
    },
    {
      title: 'Repair Orders',
      description: 'Track repair orders and work in progress',
      icon: Wrench,
      color: 'orange',
      path: '/service/repair-orders',
    },
    {
      title: 'Service History',
      description: 'View complete service history by customer or vehicle',
      icon: FileText,
      color: 'green',
      path: '/service/history',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Service Management</h1>
        <p className="text-slate-600">Manage service appointments and repair orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceModules.map((module, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(module.path)}>
            <CardHeader>
              <div className={`h-12 w-12 rounded-lg bg-${module.color}-100 flex items-center justify-center mb-4`}>
                <module.icon className={`h-6 w-6 text-${module.color}-600`} />
              </div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Open Module
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}