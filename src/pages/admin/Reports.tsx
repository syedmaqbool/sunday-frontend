import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink, Flag } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Report = {
  id: string;
  reporter_id: string;
  target_type: "user" | "listing" | "message";
  target_id: string;
  reason: string;
  details: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  admin_notes: string;
  created_at: string;
};

const STATUS_VARIANT: Record<Report["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "destructive",
  reviewing: "default",
  resolved: "secondary",
  dismissed: "outline",
};

const targetLink = (r: Report) => {
  if (r.target_type === "listing") return `/listing/${r.target_id}`;
  if (r.target_type === "user") return `/seller/${r.target_id}`;
  return null;
};

// ── Mock data (used when NEXT_PUBLIC_USE_MOCK_DATA = true) ──
// `let` so status/notes updates persist across filter switches in the mock session.
// IDs reuse mock-user-*/mock-seller-*/mock-listing-* so the "View listing/seller" links
// resolve to the same records as other mocked admin pages.
let MOCK_REPORTS: Report[] = [
  {
    id: "mock-report-1",
    reporter_id: "mock-user-2",
    target_type: "listing",
    target_id: "mock-listing-4",
    reason: "fake_listing",
    details: "These jacket photos look like they were taken from another site, not the actual item.",
    status: "pending",
    admin_notes: "",
    created_at: "2026-06-15T10:00:00Z",
  },
  {
    id: "mock-report-2",
    reporter_id: "mock-user-3",
    target_type: "user",
    target_id: "mock-seller-2",
    reason: "scam",
    details: "Seller took payment but never shipped the item, no response to messages.",
    status: "pending",
    admin_notes: "",
    created_at: "2026-06-16T08:30:00Z",
  },
  {
    id: "mock-report-3",
    reporter_id: "mock-user-1",
    target_type: "listing",
    target_id: "mock-listing-1",
    reason: "misleading_price",
    details: "Listed price doesn't match what the seller actually asked for in chat.",
    status: "pending",
    admin_notes: "",
    created_at: "2026-06-17T13:15:00Z",
  },
  {
    id: "mock-report-4",
    reporter_id: "mock-user-4",
    target_type: "message",
    target_id: "mock-message-1",
    reason: "harassment",
    details: "Buyer sent inappropriate messages after their offer was rejected.",
    status: "reviewing",
    admin_notes: "Contacted both parties, awaiting their response.",
    created_at: "2026-06-10T09:00:00Z",
  },
  {
    id: "mock-report-5",
    reporter_id: "mock-user-5",
    target_type: "listing",
    target_id: "mock-listing-2",
    reason: "inappropriate_content",
    details: "Listing photos contain unrelated, inappropriate content.",
    status: "resolved",
    admin_notes: "Listing photos removed, seller warned.",
    created_at: "2026-06-05T11:00:00Z",
  },
  {
    id: "mock-report-6",
    reporter_id: "mock-user-2",
    target_type: "user",
    target_id: "mock-seller-1",
    reason: "spam",
    details: "Seller is mass-messaging unrelated promotions to buyers.",
    status: "dismissed",
    admin_notes: "Reviewed message history, no policy violation found.",
    created_at: "2026-06-02T16:45:00Z",
  },
];

const Reports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | Report["status"]>("pending");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports", filter],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return filter === "all" ? MOCK_REPORTS : MOCK_REPORTS.filter((r) => r.status === filter);
      }
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Report["status"]; notes?: string }) => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        MOCK_REPORTS = MOCK_REPORTS.map((r) =>
          r.id === id ? { ...r, status, admin_notes: notes ?? "" } : r
        );
        const next = filter === "all" ? MOCK_REPORTS : MOCK_REPORTS.filter((r) => r.status === filter);
        queryClient.setQueryData(["admin-reports", filter], next);
        return;
      }
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          admin_notes: notes ?? "",
          resolved_by: status === "resolved" || status === "dismissed" ? user?.id : null,
          resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report updated");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: () => toast.error("Failed to update report"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Flag className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-3xl font-bold text-foreground">Reports</h1>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No reports here.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const link = targetLink(r);
            const notes = notesDraft[r.id] ?? r.admin_notes;
            return (
              <Card key={r.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    <Badge variant="outline" className="capitalize">{r.target_type}</Badge>
                    <span className="text-sm font-medium text-foreground">{r.reason.replace(/_/g, " ")}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {r.details && (
                    <p className="rounded-md bg-muted p-3 text-sm text-foreground">{r.details}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Reporter: <code className="text-foreground">{r.reporter_id.slice(0, 8)}</code></span>
                    <span>Target: <code className="text-foreground">{r.target_id.slice(0, 8)}</code></span>
                    {link && (
                      <Link to={link} className="inline-flex items-center gap-1 text-primary hover:underline">
                        View {r.target_type} <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <Textarea
                    placeholder="Admin notes..."
                    value={notes}
                    onChange={(e) => setNotesDraft({ ...notesDraft, [r.id]: e.target.value })}
                    rows={2}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: r.id, status: "reviewing", notes })}
                      disabled={updateMutation.isPending || r.status === "reviewing"}
                    >
                      Mark reviewing
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: r.id, status: "resolved", notes })}
                      disabled={updateMutation.isPending}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: r.id, status: "dismissed", notes })}
                      disabled={updateMutation.isPending}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;