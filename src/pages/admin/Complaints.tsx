import type {
  AdminComplaintStatus,
  Complaint,
  ComplaintStatus,
} from '@/types/complaint.type';
import { useQuery } from '@tanstack/react-query';

import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getAdminComplaintsOptions,
  useUpdateComplaintStatusMutation,
} from '@/queries/adminComplaint.query';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  RAISED: 'Complaint Raised',
  REFUNDED: 'Completed (Refunded)',
  REJECTED: 'Completed (Rejected)',
  RETURN_ADDRESS_PROVIDED: 'Return Address Provided',
  RETURN_APPROVED: 'Return Approved',
  RETURN_IN_TRANSIT: 'Return In Transit',
  RETURN_RECEIVED: 'Return Received',
  UNDER_REVIEW: 'Under Review',
};

type StatusFilter = 'all' | ComplaintStatus;

// ─── Component ────────────────────────────────────────────────────────────────

function AdminComplaints() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Complaint | null>(null);

  const { data, isLoading } = useQuery(getAdminComplaintsOptions(filter));
  const updateStatus = useUpdateComplaintStatusMutation();

  const complaints: Complaint[] = data?.data ?? [];

  const filtered
    = filter === 'all'
      ? complaints
      : complaints.filter(c => c.status === filter);

  const counts = complaints.reduce(
    (accumulator, c) => {
      accumulator.total++;
      accumulator[c.status] = (accumulator[c.status] ?? 0) + 1;
      return accumulator;
    },
    { total: 0 } as Record<string, number>,
  );

  const handleUpdate = (
    complaintId: string,
    status: AdminComplaintStatus,
    adminNotes?: string,
  ) => {
    updateStatus.mutate(
      { complaintId, adminNotes: adminNotes || undefined, status },
      {
        onError: (error: any) =>
          toast.error(error.message ?? 'Failed to update complaint'),
        onSuccess: () => {
          toast.success('Complaint updated');
          setSelected(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Complaints
        </h1>
        <p className="text-sm text-muted-foreground">
          Buyer-raised inadequate-quality returns. Review evidence, track
          returns, and resolve.
        </p>
      </div>

      <div className="
        grid gap-3
        sm:grid-cols-4
      "
      >
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total</p>
              <p className="font-heading text-2xl font-semibold">
                {counts.total ?? 0}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Raised</p>
            <p className="font-heading text-2xl font-semibold">
              {counts.RAISED ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">
              Return in transit
            </p>
            <p className="font-heading text-2xl font-semibold">
              {counts.RETURN_IN_TRANSIT ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Resolved</p>
            <p className="font-heading text-2xl font-semibold">
              {(counts.REFUNDED ?? 0)
                + (counts.REJECTED ?? 0)
                + (counts.RETURN_RECEIVED ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs onValueChange={v => setFilter(v as StatusFilter)} value={filter}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="RAISED">Raised</TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW">Under Review</TabsTrigger>
          <TabsTrigger value="RETURN_APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="RETURN_ADDRESS_PROVIDED">
            Address Provided
          </TabsTrigger>
          <TabsTrigger value="RETURN_IN_TRANSIT">In Transit</TabsTrigger>
          <TabsTrigger value="RETURN_RECEIVED">Received</TabsTrigger>
          <TabsTrigger value="REFUNDED">Refunded</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading
            ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (filtered.length === 0
                ? (
                    <p className="p-12 text-center text-sm text-muted-foreground">
                      No complaints in this view.
                    </p>
                  )
                : (
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
                        {filtered.map(c => (
                          <TableRow
                            key={c.id}
                            onClick={() => setSelected(c)}
                            className="cursor-pointer"
                          >
                            <TableCell className="max-w-[280px] truncate font-medium">
                              {c.reason || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge className="
                                gap-1 bg-amber-500/15 text-amber-700
                                hover:bg-amber-500/20
                              "
                              >
                                {STATUS_LABEL[c.status] ?? c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <Link
                                onClick={event => event.stopPropagation()}
                                to={`/listing/${c.listingId}`}
                                className="
                                  text-primary
                                  hover:underline
                                "
                              >
                                View
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm">
                              <Link
                                onClick={event => event.stopPropagation()}
                                to={`/seller/${c.buyerId}`}
                                className="
                                  text-primary
                                  hover:underline
                                "
                              >
                                Profile
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(c.createdAt), 'dd MMM yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ))}
        </CardContent>
      </Card>

      <ComplaintDetailDialog
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        complaint={selected}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function ComplaintDetailDialog({
  complaint,
  isPending,
  onClose,
  onUpdate,
}: {
  complaint: Complaint | null;
  isPending: boolean;
  onClose: () => void;
  onUpdate: (id: string, status: AdminComplaintStatus, notes?: string) => void;
}) {
  const [notes, setNotes] = useState(complaint?.adminNotes ?? '');

  useEffect(() => {
    setNotes(complaint?.adminNotes ?? '');
  }, [complaint?.id, complaint?.adminNotes]);

  if (!complaint)
    return null;

  const isReturnInTransit = ['RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'REFUNDED'].includes(complaint.status);

  const isReturnReceived = ['RETURN_RECEIVED', 'REFUNDED'].includes(complaint.status);

  return (
    <Dialog onOpenChange={o => !o && onClose()} open={!!complaint}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            {' '}
            Complaint
            details
          </DialogTitle>
          <DialogDescription>
            Order #
            {complaint.orderId.slice(0, 8)}
            {' '}
            ·
            {' '}
            {format(new Date(complaint.createdAt), 'PPp')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason */}
          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Reason
              </p>
              <p>{complaint.reason}</p>
            </CardContent>
          </Card>

          {/* Evidence photos */}
          {complaint.evidenceUrls.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Evidence photos
                </p>
                <div className="flex flex-wrap gap-2">
                  {complaint.evidenceUrls.map(url => (
                    <a key={url} href={url} rel="noreferrer" target="_blank">
                      <img
                        src={url}
                        alt=""
                        className="h-24 w-24 rounded-md border border-border object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return proof */}
          {complaint.returnProofUrls.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Return proof
                </p>
                {complaint.returnCarrier && (
                  <p>
                    Carrier:
                    {complaint.returnCarrier}
                  </p>
                )}
                {complaint.returnTracking && (
                  <p className="font-mono text-xs">
                    Tracking:
                    {' '}
                    {complaint.returnTracking}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {complaint.returnProofUrls.map(url => (
                    <a key={url} href={url} rel="noreferrer" target="_blank">
                      <img
                        src={url}
                        alt=""
                        className="h-24 w-24 rounded-md border border-border object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return status */}
          <Card>
            <CardContent className="space-y-3 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Return status
              </p>

              {/* 1. Return address */}
              <div className="flex items-start gap-3">
                {complaint.returnAddress
                  ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    )
                  : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    )}
                <div>
                  <p className="font-medium text-foreground">
                    {complaint.returnAddress
                      ? 'Return address provided'
                      : 'Return address not provided'}
                  </p>
                  {complaint.returnAddress && (
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      {complaint.returnAddressRecipient && (
                        <p className="text-foreground">
                          {complaint.returnAddressRecipient}
                        </p>
                      )}
                      <p>{complaint.returnAddress}</p>
                      {complaint.returnAddressPhone && (
                        <p>{complaint.returnAddressPhone}</p>
                      )}
                      {complaint.returnInstructions && (
                        <p className="text-xs italic">
                          {complaint.returnInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Buyer returned product */}
              <div className="flex items-start gap-3">
                {isReturnInTransit
                  ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    )
                  : (
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    )}
                <div>
                  <p className="font-medium text-foreground">
                    {isReturnInTransit
                      ? 'Buyer has returned the product'
                      : 'Buyer has not returned the product yet'}
                  </p>
                  {complaint.returnCarrier && (
                    <p className="text-xs text-muted-foreground">
                      Carrier:
                      {' '}
                      {complaint.returnCarrier}
                    </p>
                  )}
                  {complaint.returnTracking && (
                    <p className="font-mono text-xs text-muted-foreground">
                      Tracking:
                      {' '}
                      {complaint.returnTracking}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Seller received item */}
              <div className="flex items-start gap-3">
                {isReturnReceived
                  ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    )
                  : (
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    )}
                <div>
                  <p className="font-medium text-foreground">
                    {isReturnReceived
                      ? 'Seller has received the returned item'
                      : 'Seller has not received the returned item yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/listing/${complaint.listingId}`}
              className="
                inline-flex items-center gap-1 text-xs text-primary
                hover:underline
              "
            >
              View listing
              {' '}
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to={`/seller/${complaint.buyerId}`}
              className="
                inline-flex items-center gap-1 text-xs text-primary
                hover:underline
              "
            >
              Buyer profile
              {' '}
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to={`/seller/${complaint.sellerId}`}
              className="
                inline-flex items-center gap-1 text-xs text-primary
                hover:underline
              "
            >
              Seller profile
              {' '}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Resolved by */}
          {complaint.resolvedAt && (
            <p className="text-xs text-muted-foreground">
              Resolved by
              {' '}
              {complaint.resolverFullName ?? '—'}
              {' '}
              ·
              {' '}
              {format(new Date(complaint.resolvedAt), 'PPp')}
            </p>
          )}

          {/* Admin notes */}
          <div>
            <Label htmlFor="admin-notes">
              Admin notes (visible to buyer &amp; seller)
            </Label>
            <Textarea
              id="admin-notes"
              onChange={event => setNotes(event.target.value)}
              value={notes}
              placeholder="Explain your decision. This message will be shown to both buyer and seller."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            onClick={() => onUpdate(complaint.id, 'RETURN_APPROVED', notes)}
            disabled={isPending}
            variant="outline"
          >
            Approve return
          </Button>
          <Button
            onClick={() => onUpdate(complaint.id, 'RETURN_RECEIVED', notes)}
            disabled={isPending}
            variant="outline"
          >
            Mark return received
          </Button>
          <Button
            onClick={() => onUpdate(complaint.id, 'REFUNDED', notes)}
            disabled={isPending}
            variant="outline"
          >
            Complete · Refund buyer
          </Button>
          <Button
            onClick={() => onUpdate(complaint.id, 'REJECTED', notes)}
            disabled={isPending}
            variant="ghost"
          >
            Reject return request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminComplaints;
