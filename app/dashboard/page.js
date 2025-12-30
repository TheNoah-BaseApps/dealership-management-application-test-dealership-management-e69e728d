'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import MetricCard from '@/components/MetricCard';
import ChartWidget from '@/components/ChartWidget';
import QuickActions from '@/components/QuickActions';
import { Users, Car, Wrench, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data.data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening today.</p>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Leads"
          value={metrics?.activeLeads || 0}
          icon={Users}
          trend={metrics?.leadsChange}
          color="blue"
        />
        <MetricCard
          title="Inventory Value"
          value={`$${(metrics?.inventoryValue || 0).toLocaleString()}`}
          icon={Car}
          trend={metrics?.inventoryChange}
          color="green"
        />
        <MetricCard
          title="Pending Appointments"
          value={metrics?.pendingAppointments || 0}
          icon={Wrench}
          trend={metrics?.appointmentsChange}
          color="orange"
        />
        <MetricCard
          title="Monthly Sales"
          value={`$${(metrics?.monthlySales || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={metrics?.salesChange}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartWidget
              type="line"
              data={metrics?.salesChart || []}
              title="Monthly Sales Trend"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartWidget
              type="pie"
              data={metrics?.leadStatusChart || []}
              title="Lead Pipeline"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Parts Requiring Restock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.lowStockParts?.length > 0 ? (
              <div className="space-y-3">
                {metrics.lowStockParts.slice(0, 5).map((part) => (
                  <div key={part.part_id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{part.part_name}</p>
                      <p className="text-sm text-slate-500">#{part.part_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {part.quantity} / {part.min_quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">All parts are well stocked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.recentSales?.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.sale_id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{sale.customer_name}</p>
                      <p className="text-sm text-slate-500">{sale.vehicle_info}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        ${sale.sale_price?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No recent sales</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}