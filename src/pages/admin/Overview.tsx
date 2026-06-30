import { useQuery } from '@tanstack/react-query';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Package,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utilities';
import { getAdminAnalyticsQueryOptions } from '@/queries/adminAnalytics.query';

export default function Overview() {
  const { data, isLoading } = useQuery(getAdminAnalyticsQueryOptions());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.kpis;

  const cards = [
    {
      color: 'text-primary',
      icon: Package,
      label: 'Total Listings',
      value: stats?.totalListings ?? 0,
    },
    {
      color: 'text-primary',
      icon: Users,
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
    },
    {
      color: 'text-destructive',
      icon: Clock,
      label: 'Pending Review',
      value: stats?.pendingListings ?? 0,
    },
    {
      color: 'text-destructive',
      icon: AlertTriangle,
      label: 'Flagged Messages',
      value: stats?.flaggedMessages ?? 0,
    },
    {
      color: 'text-primary',
      icon: CheckCircle,
      label: 'Approved Listings',
      value: stats?.approvedListings ?? 0,
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Dashboard
      </h1>

      <p className="mt-1 text-muted-foreground">Overview of your marketplace</p>

      <div className="
        mt-8 grid gap-4
        sm:grid-cols-2
        lg:grid-cols-4
      "
      >
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>

              <c.icon className={cn('h-5 w-5', c.color)} />
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
