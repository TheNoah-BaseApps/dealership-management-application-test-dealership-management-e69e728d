'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, Wrench, TrendingUp, Shield, MessageSquare } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    { icon: Car, title: 'Inventory Management', description: 'Track vehicles from acquisition to sale with VIN management' },
    { icon: Users, title: 'Lead Management', description: 'Capture, qualify, and convert leads with AI-powered scoring' },
    { icon: Wrench, title: 'Service Scheduling', description: 'Manage appointments and repair orders efficiently' },
    { icon: TrendingUp, title: 'Sales Pipeline', description: 'Track deals from lead to close with comprehensive analytics' },
    { icon: Shield, title: 'Compliance & Audit', description: 'Complete audit trail for all dealership transactions' },
    { icon: MessageSquare, title: 'Communication Hub', description: 'Internal messaging and task management system' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">DealershipPro</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button onClick={() => router.push('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Complete Dealership Management</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Streamline your dealership operations with AI-powered lead management, inventory tracking, 
            service scheduling, and comprehensive compliance tools.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => router.push('/register')}>
              Start Free Trial
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="bg-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to transform your dealership?</h2>
              <p className="text-lg mb-6">Join hundreds of dealerships already using DealershipPro</p>
              <Button size="lg" variant="secondary" onClick={() => router.push('/register')}>
                Get Started Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}