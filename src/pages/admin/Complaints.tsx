import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  raised: "Complaint Raised",
  return_in_transit: "Return In Transit",
  return_received: "Return Received",
  refunded: "Refunded",
  rejected: "Rejected",
};

type StatusFilter = "all" | "raised" | "return_in_transit" | "return_received" | "refunded" | "rejected";

type ComplaintRow = {
  id: string;
  order_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  evidence_urls: string[];
  return_proof_urls: string[];
  return_carrier: string | null;
  return_tracking: string | null;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
};

const AdminComplaints = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ComplaintRow | null>(null);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ComplaintRow[];
    },
  });

  const filtered = filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  const counts = complaints.reduce(
    (acc, c) => {
      acc.total++;
      acc[c.status as keyof typeof acc] = (acc[c.status as keyof typeof acc] ?? 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({
        status,
        ...(notes !== undefined ? { admin_notes: notes } : {}),
        ...(status === "refunded" || status === "rejected" || status === "return_received"
          ? { resolved_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Complaint updated");
    queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          Buyer-raised inadequate-quality returns. Review evidence, track returns, and resolve.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total</p>
              <p className="font-heading text-2xl font-semibold">{counts.total ?? 0}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Raised</p>
            <p className="font-heading text-2xl font-semibold">{counts.raised ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Return in transit</p>
            <p className="font-heading text-2xl font-semibold">{counts.return_in_transit ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Resolved</p>
            <p className="font-heading text-2xl font-semibold">
              {(counts.refunded ?? 0) + (counts.rejected ?? 0) + (counts.return_received ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="raised">Raised</TabsTrigger>
          <TabsTrigger value="return_in_transit">Return in transit</TabsTrigger>
          <TabsTrigger value="return_received">Received</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">No complaints in this view.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                    <TableCell className="max-w-[280px] truncate font-medium">{c.reason || "—"}</TableCell>
                    <TableCell>
                      <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Link to={`/listing/${c.listing_id}`} className="text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Link to={`/seller/${c.buyer_id}`} className="text-primary hover:underline">
                        Profile
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.created_at), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ComplaintDetailDialog complaint={selected} onClose={() => setSelected(null)} onUpdate={updateStatus} />
    </div>
  );
};

const ComplaintDetailDialog = ({
  complaint,
  onClose,
  onUpdate,
}: {
  complaint: ComplaintRow | null;
  onClose: () => void;
  onUpdate: (id: string, status: string, notes?: string) => void;
}) => {
  const [notes, setNotes] = useState("");

  if (!complaint) return null;

  return (
    <Dialog open={!!complaint} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Complaint details
          </DialogTitle>
          <DialogDescription>
            Order #{complaint.order_id.slice(0, 8)} · {format(new Date(complaint.created_at), "PPp")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Reason</p>
              <p>{complaint.reason}</p>
            </CardContent>
          </Card>

          {complaint.evidence_urls?.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Evidence photos</p>
                <div className="flex flex-wrap gap-2">
                  {complaint.evidence_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="h-24 w-24 rounded-md border border-border object-cover" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {complaint.return_proof_urls?.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Return proof</p>
                {complaint.return_carrier && <p>Carrier: {complaint.return_carrier}</p>}
                {complaint.return_tracking && (
                  <p className="font-mono text-xs">Tracking: {complaint.return_tracking}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {complaint.return_proof_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="h-24 w-24 rounded-md border border-border object-cover" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/listing/${complaint.listing_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View listing <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to={`/seller/${complaint.buyer_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Buyer profile <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to={`/seller/${complaint.seller_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Seller profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div>
            <Label htmlFor="admin-notes">Admin notes</Label>
            <Textarea
              id="admin-notes"
              rows={3}
              defaultValue={complaint.admin_notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onUpdate(complaint.id, "return_received", notes || undefined)}>
            Mark return received
          </Button>
          <Button variant="outline" onClick={() => onUpdate(complaint.id, "refunded", notes || undefined)}>
            Mark refunded
          </Button>
          <Button variant="ghost" onClick={() => onUpdate(complaint.id, "rejected", notes || undefined)}>
            Reject complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminComplaints;
