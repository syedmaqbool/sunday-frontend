import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Package, Star, Eye, ShoppingBag } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(15 60% 45%)" },
  offers: { label: "Offers", color: "hsl(35 60% 55%)" },
  accepted: { label: "Accepted", color: "hsl(140 50% 40%)" },
  rejected: { label: "Rejected", color: "hsl(0 60% 50%)" },
  pending: { label: "Pending", color: "hsl(45 70% 50%)" },
} satisfies ChartConfig;

const CATEGORY_COLORS = [
  "hsl(15 60% 45%)",
  "hsl(35 60% 55%)",
  "hsl(140 50% 40%)",
  "hsl(200 60% 50%)",
  "hsl(270 50% 55%)",
  "hsl(45 70% 50%)",
];

const SellerAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["seller-analytics-listings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["seller-analytics-offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("seller_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["seller-analytics-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading) return null;
  if (!user) return null;

  const isLoading = listingsLoading || offersLoading || reviewsLoading;

  // KPI calculations
  const acceptedOffers = offers.filter((o) => o.status === "accepted");
  const totalRevenue = acceptedOffers.reduce((sum, o) => sum + Number(o.counter_amount ?? o.amount), 0);
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const conversionRate = offers.length > 0 ? ((acceptedOffers.length / offers.length) * 100).toFixed(1) : "0";
  const activeListings = listings.filter((l) => l.status === "approved").length;

  // Monthly revenue chart (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthOffers = acceptedOffers.filter((o) => {
      const d = new Date(o.updated_at);
      return d >= start && d <= end;
    });
    return {
      month: format(date, "MMM"),
      revenue: monthOffers.reduce((s, o) => s + Number(o.counter_amount ?? o.amount), 0),
      offers: offers.filter((o) => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      }).length,
    };
  });

  // Category breakdown
  const categoryMap = new Map<string, number>();
  listings.forEach((l) => {
    categoryMap.set(l.category, (categoryMap.get(l.category) || 0) + 1);
  });
  const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }));

  // Offer status breakdown
  const offerStatusData = [
    { name: "Accepted", value: offers.filter((o) => o.status === "accepted").length, fill: "hsl(140 50% 40%)" },
    { name: "Pending", value: offers.filter((o) => o.status === "pending").length, fill: "hsl(45 70% 50%)" },
    { name: "Rejected", value: offers.filter((o) => o.status === "rejected").length, fill: "hsl(0 60% 50%)" },
    { name: "Countered", value: offers.filter((o) => o.status === "countered").length, fill: "hsl(200 60% 50%)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-5xl flex-1 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Sales Analytics</h1>
          <p className="mt-1 text-muted-foreground">Track your performance and insights</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              <Card>
                <CardContent className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Revenue</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    R {totalRevenue.toLocaleString()}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="text-xs font-medium">Sales</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {acceptedOffers.length}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-medium">Active Listings</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {activeListings}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Conversion</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {conversionRate}%
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span className="text-xs font-medium">Avg Rating</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Revenue Over Time */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue & Offers (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="offers" fill="var(--color-offers)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Listings by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[240px] w-full">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No listings yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Offer Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Offer Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  {offerStatusData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[240px] w-full">
                      <PieChart>
                        <Pie
                          data={offerStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {offerStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No offers yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {acceptedOffers.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No completed sales yet</p>
                ) : (
                  <div className="space-y-3">
                    {acceptedOffers
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .slice(0, 10)
                      .map((offer) => {
                        const listing = listings.find((l) => l.id === offer.listing_id);
                        return (
                          <div key={offer.id} className="flex items-center justify-between rounded-md border border-border p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {listing?.title ?? "Listing"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(offer.updated_at), "MMM d, yyyy")}
                              </p>
                            </div>
                            <span className="shrink-0 font-heading text-sm font-bold text-foreground">
                              R {Number(offer.counter_amount ?? offer.amount).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SellerAnalytics;
