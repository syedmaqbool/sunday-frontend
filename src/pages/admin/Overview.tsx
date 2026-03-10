import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";

const Overview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [listings, profiles, pending, approved, flagged] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("flagged", true),
      ]);
      return {
        totalListings: listings.count ?? 0,
        totalUsers: profiles.count ?? 0,
        pendingListings: pending.count ?? 0,
        approvedListings: approved.count ?? 0,
        flaggedMessages: flagged.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: "Total Listings", value: stats?.totalListings ?? 0, icon: Package, color: "text-primary" },
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { label: "Pending Review", value: stats?.pendingListings ?? 0, icon: Clock, color: "text-destructive" },
    { label: "Flagged Messages", value: stats?.flaggedMessages ?? 0, icon: AlertTriangle, color: "text-destructive" },
    { label: "Approved", value: stats?.approvedListings ?? 0, icon: CheckCircle, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Overview of your marketplace</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={cn("h-5 w-5", c.color)} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// need cn import
import { cn } from "@/lib/utils";

export default Overview;
