import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

const Reports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | Report["status"]>("pending");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports", filter],
    queryFn: async () => {
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Report["status"]; notes?: string }) => {
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
