import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSellerAnalyticsOptions } from "@/queries/useSellerAnalytic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  Star,
  ShoppingBag,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const OFFER_STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "hsl(140 50% 40%)",
  PENDING: "hsl(45 70% 50%)",
  REJECTED: "hsl(0 60% 50%)",
  COUNTERED: "hsl(200 60% 50%)",
  WITHDRAWN: "hsl(270 50% 55%)",
  EXPIRED: "hsl(0 0% 60%)",
};

// ─── Component ────────────────────────────────────────────────────────────────

const SellerAnalytics = () => {
  const { data: response, isLoading } = useQuery(getSellerAnalyticsOptions());
  const analytics = response?.data;

  // Chart data derived from API response
  const monthlyChartData =
    analytics?.monthlyAcceptedOfferValue.map((m) => ({
      month: m.label.split(" ")[0], // "Jan 2026" → "Jan"
      revenue: m.totalValue,
    })) ?? [];

  const categoryData =
    analytics?.listingCategoryDistribution.map((c) => ({
      name: c.category,
      value: c.count,
    })) ?? [];

  const offerStatusData =
    analytics?.offerStatusCounts
      .filter((o) => o.count > 0)
      .map((o) => ({
        name: o.status.charAt(0) + o.status.slice(1).toLowerCase(),
        value: o.count,
        fill: OFFER_STATUS_COLORS[o.status] ?? "hsl(0 0% 60%)",
      })) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-5xl flex-1 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Sales Analytics
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your performance and insights
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !analytics ? null : (
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
                    Rs {analytics.totalAcceptedOfferValue.toLocaleString()}
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
                    {analytics.acceptedOffers}
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
                    {analytics.activeListings}
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
                    {analytics.conversionRate}%
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
                    {analytics.averageRating > 0
                      ? analytics.averageRating.toFixed(1)
                      : "—"}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Monthly Revenue Bar Chart */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Revenue (Last 6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[280px] w-full"
                  >
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border/40"
                      />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="revenue"
                        fill="var(--color-revenue)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Listings by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-[240px] w-full"
                    >
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
                            <Cell
                              key={i}
                              fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No listings yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Offer Outcomes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Offer Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  {offerStatusData.length > 0 ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-[240px] w-full"
                    >
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
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No offers yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SellerAnalytics;
