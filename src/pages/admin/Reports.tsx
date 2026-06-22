import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminReports, useResolveReport } from "@/queries/useAdminReport";
import type { AdminReport, ReportStatus } from "@/services/report.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink, Flag } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const STATUS_VARIANT: Record<ReportStatus, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  RESOLVED: "secondary",
  DISMISSED: "outline",
};

const getTargetType = (r: AdminReport): "listing" | "user" | "message" | "conversation" | null => {
  if (r.listingId) return "listing";
  if (r.reportedUserId) return "user";
  if (r.messageId) return "message";
  if (r.conversationId) return "conversation";
  return null;
};

const targetLink = (r: AdminReport) => {
  if (r.listingId) return `/listing/${r.listingId}`;
  if (r.reportedUserId) return `/seller/${r.reportedUserId}`;
  return null;
};

const Reports = () => {
  const [filter, setFilter] = useState<ReportStatus | "all">("OPEN");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const { data: reports = [], isLoading } = useAdminReports(filter);
  const resolveReport = useResolveReport();

  const handleUpdate = (id: string, status: "DISMISSED" | "RESOLVED", notes?: string) => {
    resolveReport.mutate(
      { reportId: id, status, adminNotes: notes },
      {
        onSuccess: () => toast.success("Report updated"),
        onError: (e: any) => toast.error(e.message ?? "Failed to update report"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Flag className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-3xl font-bold text-foreground">Reports</h1>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ReportStatus | "all")}>
        <TabsList>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
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
            const targetType = getTargetType(r);
            const notes = notesDraft[r.id] ?? r.adminNotes ?? "";
            return (
              <Card key={r.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    {targetType && (
                      <Badge variant="outline" className="capitalize">{targetType}</Badge>
                    )}
                    <span className="text-sm font-medium text-foreground">{r.reason.replace(/_/g, " ")}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {r.details && (
                    <p className="rounded-md bg-muted p-3 text-sm text-foreground">{r.details}</p>
                  )}

                  {r.listingTitle && (
                    <p className="text-xs text-muted-foreground">Listing: <span className="text-foreground">{r.listingTitle}</span></p>
                  )}
                  {r.messageContent && (
                    <p className="rounded-md bg-muted/50 p-2 text-xs italic text-muted-foreground">"{r.messageContent}"</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Reporter: <span className="text-foreground">{r.reporterFullName}</span></span>
                    {r.reportedUserFullName && (
                      <span>Reported: <span className="text-foreground">{r.reportedUserFullName}</span></span>
                    )}
                    {link && (
                      <Link to={link} className="inline-flex items-center gap-1 text-primary hover:underline">
                        View {targetType} <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  {r.status !== "OPEN" && (
                    <p className="text-xs text-muted-foreground">
                      Resolved by {r.resolverFullName ?? "—"} · {r.resolvedAt ? formatDistanceToNow(new Date(r.resolvedAt), { addSuffix: true }) : "—"}
                    </p>
                  )}

                  <Textarea
                    placeholder="Admin notes..."
                    value={notes}
                    onChange={(e) => setNotesDraft({ ...notesDraft, [r.id]: e.target.value })}
                    rows={2}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(r.id, "RESOLVED", notes)}
                      disabled={resolveReport.isPending}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdate(r.id, "DISMISSED", notes)}
                      disabled={resolveReport.isPending}
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