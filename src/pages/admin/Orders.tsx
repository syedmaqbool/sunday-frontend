import type { AdminOrder, AdminOrderDetail, AdminOrderItem } from '@/types/adminOrder.type';
import type { AdminComplaint } from '@/types/complaint.type';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { format, startOfDay, startOfMonth, subDays } from 'date-fns';
import { HTTPError } from 'ky';
import { AlertTriangle, ExternalLink, Loader2, MessageSquareWarning, Package, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminManualPaymentReviewDialog, maskSenderAccountNumber } from '@/components/admin/AdminManualPaymentReviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccessControl } from '@/hooks/useAccessControl';
import {
  getAdminComplaintsForOrdersOptions,
} from '@/queries/adminComplaint.query';
import {
  getAdminOrderOptions,
  getAdminOrdersOptions,
  getAdminReservedListingsOptions,
  useCancelAdminOrderMutation,
} from '@/queries/adminOrders.query';

// ── Display types ─────────────────────────────────────────────────────────────
type EffectiveStatus = 'cancelled' | 'delivered' | 'shipped' | 'sold';
type StatusFilter = 'all' | 'manual-review' | 'reserved' | EffectiveStatus;
type DateFilter = '7d' | 'all' | 'month' | 'today';

interface Row {
  orderId: string;
  buyerName: string;
  city: string;
  created_at: string;
  effective: EffectiveStatus;
  item: AdminOrderDetail['items'][number] | AdminOrderItem;
  order: AdminOrder | AdminOrderDetail;
}

function dateFilterStart(filter: DateFilter) {
  const now = new Date();
  if (filter === 'today')
    return startOfDay(now);
  if (filter === '7d')
    return subDays(startOfDay(now), 6);
  if (filter === 'month')
    return startOfMonth(now);
  return null;
}

// Item-level status → display label (CONFIRMED→sold, SHIPPED→shipped, DELIVERED→delivered)
function effectiveStatus(status: AdminOrderItem['status'], orderStatus?: AdminOrder['status']): EffectiveStatus {
  if (orderStatus === 'CANCELLED')
    return 'cancelled';
  if (['AWAITING_PAYMENT', 'CANCELLED', 'CONFIRMED'].includes(status))
    return 'sold';
  if (status === 'SHIPPED')
    return 'shipped';
  return 'delivered';
}

function latestManualPaymentSubmission(order: AdminOrder | AdminOrderDetail) {
  return [...order.manualPaymentSubmissions]
    .toSorted((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;
}

function hasActionableManualPayment(order: AdminOrder) {
  return latestManualPaymentSubmission(order)?.status === 'SUBMITTED';
}

function rowFromOrderDetail(order: AdminOrderDetail, selectedItemId: string | null): Row | null {
  const item = order.items.find(orderItem => orderItem.id === selectedItemId) ?? order.items[0];
  if (!item)
    return null;

  return {
    orderId: order.id,
    buyerName: [order.shippingFirstName, order.shippingLastName].filter(Boolean).join(' ') || '—',
    city: order.shippingCity,
    created_at: order.createdAt,
    effective: effectiveStatus(item.status, order.status),
    item,
    order,
  };
}

const complaintStatusLabels: Record<AdminComplaint['status'], string> = {
  RAISED: 'Complaint Raised',
  REFUNDED: 'Completed (Refunded)',
  REJECTED: 'Completed (Rejected)',
  RETURN_ADDRESS_PROVIDED: 'Return Address Provided',
  RETURN_APPROVED: 'Return Approved',
  RETURN_IN_TRANSIT: 'Return In Transit',
  RETURN_RECEIVED: 'Return Received',
  UNDER_REVIEW: 'Under Review',
};

function isActiveComplaint(status: AdminComplaint['status']) {
  return !['RETURN_RECEIVED', 'REFUNDED', 'REJECTED'].includes(status);
}

// ── Component ─────────────────────────────────────────────────────────────────
function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const { can } = useAccessControl();
  const canReviewPayments = can('ORDERS_UPDATE');
  const canReadComplaints = can('COMPLAINTS_READ');

  const { data: ordersResponse, isLoading } = useQuery(getAdminOrdersOptions({
    search: search.trim() || undefined,
    size: 100,
    sortOrder: 'desc',
    sortBy: 'createdAt',
  }));
  const { data: reservedResponse, isLoading: reservedLoading } = useQuery(getAdminReservedListingsOptions(statusFilter === 'reserved'));
  const orders = ordersResponse?.data;
  const orderIds = useMemo(() => orders?.map(order => order.id) ?? [], [orders]);
  const {
    data: complaintsResponse,
    fetchNextPage: fetchNextComplaintsPage,
    hasNextPage: hasNextComplaintsPage,
    isFetchingNextPage: isFetchingNextComplaintsPage,
  } = useInfiniteQuery(getAdminComplaintsForOrdersOptions(orderIds, canReadComplaints));
  const complaints = complaintsResponse?.pages.flatMap(page => page.data) ?? [];
  const reservedListings = reservedResponse?.data ?? [];
  const selectedOrderId = searchParams.get('order');
  const selectedItemId = searchParams.get('item');
  const selectedPaymentSubmissionId = searchParams.get('paymentSubmission');
  const selectedReviewOrderId = selectedPaymentSubmissionId ? selectedOrderId : null;
  const selectedOrderDetailQuery = useQuery({
    ...getAdminOrderOptions(selectedOrderId ?? 'missing', Boolean(selectedOrderId)),
    retry: false,
  });

  useEffect(() => {
    if (hasNextComplaintsPage && !isFetchingNextComplaintsPage)
      void fetchNextComplaintsPage();
  }, [fetchNextComplaintsPage, hasNextComplaintsPage, isFetchingNextComplaintsPage]);

  // Flatten orders → item rows
  const rows = useMemo<Row[]>(() => {
    const start = dateFilterStart(dateFilter);
    const flat: Row[] = [];
    const orderList = orders ?? [];

    for (const o of orderList) {
      if (start && new Date(o.createdAt) < start)
        continue;
      if (statusFilter === 'manual-review' && !hasActionableManualPayment(o))
        continue;
      const buyerName
        = [o.shippingFirstName, o.shippingLastName].filter(Boolean).join(' ')
          || '—';

      for (const item of o.items) {
        const eff = effectiveStatus(item.status, o.status);
        if (
          statusFilter !== 'all'
          && statusFilter !== 'reserved'
          && statusFilter !== 'manual-review'
          && eff !== statusFilter
        ) {
          continue;
        }

        flat.push({
          orderId: o.id,
          buyerName,
          city: o.shippingCity,
          created_at: o.createdAt,
          effective: eff,
          item,
          order: o,
        });
      }
    }
    return flat;
  }, [orders, statusFilter, dateFilter]);

  useEffect(() => {
    if (isLoading)
      return;
    if (!selectedOrderId) {
      setSelected(null);
      return;
    }

    const matchingOrderRows = rows.filter(row => row.orderId === selectedOrderId);
    if (matchingOrderRows.length > 0) {
      const selectedRow = matchingOrderRows.find(row => row.item.id === selectedItemId)
        ?? matchingOrderRows[0];
      setSelected(selectedRow);

      if (selectedItemId && matchingOrderRows.every(row => row.item.id !== selectedItemId)) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.delete('item');
          return next;
        }, { replace: true });
      }
      return;
    }

    if (selectedOrderDetailQuery.isLoading)
      return;

    if (selectedOrderDetailQuery.isError) {
      if (!(selectedOrderDetailQuery.error instanceof HTTPError)
        || selectedOrderDetailQuery.error.response.status !== 404) {
        return;
      }
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('order');
        next.delete('item');
        next.delete('paymentSubmission');
        return next;
      }, { replace: true });
      setSelected(null);
      return;
    }

    const order = selectedOrderDetailQuery.data?.data;
    const selectedRow = order ? rowFromOrderDetail(order, selectedItemId) : null;
    if (!selectedRow) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('order');
        next.delete('item');
        next.delete('paymentSubmission');
        return next;
      }, { replace: true });
      setSelected(null);
      return;
    }

    setSelected(selectedRow);
    if (selectedItemId && !order?.items.some(item => item.id === selectedItemId)) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('item');
        return next;
      }, { replace: true });
    }
  }, [isLoading, rows, selectedItemId, selectedOrderDetailQuery.data, selectedOrderDetailQuery.error, selectedOrderDetailQuery.isError, selectedOrderDetailQuery.isLoading, selectedOrderId, setSearchParams]);

  useEffect(() => {
    if (!selectedPaymentSubmissionId || !selectedOrderId || selectedOrderDetailQuery.isLoading)
      return;
    if (selectedOrderDetailQuery.isError)
      return;

    const order = selectedOrderDetailQuery.data?.data;
    if (!order || order.manualPaymentSubmissions.some(submission => submission.id === selectedPaymentSubmissionId))
      return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('order');
      next.delete('item');
      next.delete('paymentSubmission');
      return next;
    }, { replace: true });
  }, [selectedOrderDetailQuery.data, selectedOrderDetailQuery.isError, selectedOrderDetailQuery.isLoading, selectedOrderId, selectedPaymentSubmissionId, setSearchParams]);

  // KPI counts are returned with the generated order list response.
  const counts = useMemo(() => {
    const start = dateFilterStart(dateFilter);
    const orderList = orders ?? [];
    let sold = 0;
    let shipped = 0;
    let received = 0;
    let completed = 0;

    for (const o of orderList) {
      if (start && new Date(o.createdAt) < start)
        continue;
      sold += o.itemStatusCounts.confirmed;
      shipped += o.itemStatusCounts.shipped;
      received += o.itemStatusCounts.received;
      completed += o.itemStatusCounts.completed;
    }
    return {
      completed,
      received,
      shipped,
      sold,
      total: sold + shipped + received + completed,
    };
  }, [orders, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          Track sold and shipped items across the marketplace.
        </p>
      </div>

      <div className="
        grid gap-3
        sm:grid-cols-2
        lg:grid-cols-5
      "
      >
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Total items
              </p>
              <p className="font-heading text-2xl font-semibold">
                {counts.total}
              </p>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Sold</p>
            <p className="font-heading text-2xl font-semibold">{counts.sold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Shipped</p>
            <p className="font-heading text-2xl font-semibold">
              {counts.shipped}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Received</p>
            <p className="font-heading text-2xl font-semibold">
              {counts.received}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Completed</p>
            <p className="font-heading text-2xl font-semibold">
              {counts.completed}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tabs
          onValueChange={v => setStatusFilter(v as StatusFilter)}
          value={statusFilter}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sold">Sold</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="manual-review">Manual review</TabsTrigger>
            <TabsTrigger value="reserved">Reserved</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs
          onValueChange={v => setDateFilter(v as DateFilter)}
          value={dateFilter}
        >
          <TabsList>
            <TabsTrigger value="all">All time</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">Last 7 days</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
          </TabsList>
        </Tabs>
        {statusFilter !== 'reserved' && (
          <div className="
            relative ml-auto w-full
            sm:w-64
          "
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              onChange={event => setSearch(event.target.value)}
              value={search}
              aria-label="Search by order #"
              placeholder="Search by order #"
              className="pl-9"
            />
          </div>
        )}
      </div>

      {statusFilter === 'reserved'
        ? (
            <Card>
              <CardContent className="p-0">
                {reservedLoading
                  ? (
                      <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )
                  : (reservedListings.length === 0
                      ? (
                          <p className="p-12 text-center text-sm text-muted-foreground">
                            No reserved listings right now.
                          </p>
                        )
                      : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Reserved for</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reservedListings.map((l) => {
                                const expiresAt = new Date(l.reservationExpiresAt);
                                const isExpired = expiresAt.getTime() < Date.now();
                                return (
                                  <TableRow key={l.reservationId}>
                                    <TableCell className="font-medium">
                                      <Link
                                        to={`/listing/${l.listingId}`}
                                        className="
                                          inline-flex items-center gap-1
                                          hover:underline
                                        "
                                      >
                                        {l.title}
                                        {' '}
                                        <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {l.sellerFullName}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {l.buyerFullName}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={isExpired ? 'destructive' : 'secondary'}
                                      >
                                        {format(expiresAt, 'MMM d, p')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      Rs
                                      {' '}
                                      {l.price.toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ))}
              </CardContent>
            </Card>
          )
        : (
            <Card>
              <CardContent className="p-0">
                {isLoading
                  ? (
                      <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )
                  : (rows.length === 0
                      ? (
                          <p className="p-12 text-center text-sm text-muted-foreground">
                            No orders match these filters.
                          </p>
                        )
                      : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment review</TableHead>
                                <TableHead>Sender account</TableHead>
                                <TableHead>Tracking</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map((r) => {
                                const submission = latestManualPaymentSubmission(r.order);
                                const complaint = canReadComplaints
                                  ? complaints.find(item => item.orderItemId === r.item.id && item.listingId === r.item.listingId)
                                  : undefined;

                                return (
                                  <TableRow
                                    key={r.item.id}
                                    onClick={() => {
                                      setSearchParams((current) => {
                                        const next = new URLSearchParams(current);
                                        next.set('order', r.orderId);
                                        next.set('item', r.item.id);
                                        return next;
                                      });
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">
                                          #
                                          {r.orderId.slice(0, 8)}
                                        </span>
                                        {complaint && (
                                          <ComplaintBadge
                                            onClick={() => setSelectedComplaint(complaint)}
                                            complaint={complaint}
                                          />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {r.item.title}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">{r.buyerName}</div>
                                      {r.city && (
                                        <div className="text-xs text-muted-foreground">
                                          {r.city}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          r.effective === 'shipped' ? 'default' : 'secondary'
                                        }
                                      >
                                        {r.effective}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {submission
                                        ? (
                                            <Badge variant={submission.status === 'SUBMITTED' ? 'outline' : 'secondary'}>
                                              {submission.status.replaceAll('_', ' ')}
                                            </Badge>
                                          )
                                        : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {submission
                                        ? (
                                            <div className="space-y-1">
                                              <span className="font-mono text-xs">
                                                {maskSenderAccountNumber(submission.senderAccountNumber)}
                                              </span>
                                              {submission.status === 'SUBMITTED' && (
                                                <Button
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSearchParams((current) => {
                                                      const next = new URLSearchParams(current);
                                                      next.set('order', r.orderId);
                                                      next.set('paymentSubmission', submission.id);
                                                      return next;
                                                    });
                                                  }}
                                                  size="sm"
                                                  variant="outline"
                                                  className="block"
                                                >
                                                  Review payment
                                                </Button>
                                              )}
                                            </div>
                                          )
                                        : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {r.item.trackingNumber
                                        ? (
                                            <div>
                                              <div>{r.item.shippingMethod ?? '—'}</div>
                                              <div className="font-mono text-xs">
                                                {r.item.trackingNumber}
                                              </div>
                                            </div>
                                          )
                                        : (
                                            '—'
                                          )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {format(new Date(r.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      Rs
                                      {' '}
                                      {r.item.price.toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ))}
              </CardContent>
            </Card>
          )}

      <OrderDetailDialog
        onClose={() => {
          setSelected(null);
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete('order');
            next.delete('item');
            return next;
          });
        }}
        row={selectedReviewOrderId ? null : selected}
        canCancel={canReviewPayments}
      />
      <ComplaintDialog
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
      />
      <AdminManualPaymentReviewDialog
        orderId={selectedReviewOrderId}
        submissionId={selectedPaymentSubmissionId}
        onClose={() => {
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete('order');
            next.delete('item');
            next.delete('paymentSubmission');
            return next;
          });
        }}
        canReview={canReviewPayments}
      />
    </div>
  );
}

function ComplaintBadge({ complaint, onClick }: { complaint: AdminComplaint; onClick: () => void }) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label="View complaint details"
      title="View complaint details"
      type="button"
    >
      <Badge variant={isActiveComplaint(complaint.status) ? 'destructive' : 'secondary'} className="gap-1">
        <MessageSquareWarning className="h-3 w-3" />
        Complaint
      </Badge>
    </button>
  );
}

function ComplaintDialog({ complaint, onClose }: { complaint: AdminComplaint | null; onClose: () => void }) {
  if (!complaint)
    return null;

  const active = isActiveComplaint(complaint.status);
  return (
    <Dialog onOpenChange={open => !open && onClose()} open>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <AlertTriangle className={`
              h-5 w-5
              ${active ? 'text-destructive' : 'text-muted-foreground'}
            `}
            />
            Order Complaint
          </DialogTitle>
          <DialogDescription>
            Order #
            {complaint.orderId.slice(0, 8)}
            {' · raised '}
            {format(new Date(complaint.createdAt), 'PPp')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={active ? 'destructive' : 'secondary'}>
              {complaintStatusLabels[complaint.status]}
            </Badge>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Reason</p>
            <p>{complaint.reason || '—'}</p>
          </div>

          {complaint.adminNotes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Admin notes</p>
              <p>{complaint.adminNotes}</p>
            </div>
          )}

          {complaint.evidenceUrls.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Evidence</p>
              <div className="flex flex-wrap gap-2">
                {complaint.evidenceUrls.map((url, index) => (
                  <a key={url} href={url} rel="noreferrer" target="_blank">
                    <img src={url} alt={`Evidence ${index + 1}`} className="h-16 w-16 rounded-md object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {complaint.returnProofUrls.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Return proof</p>
              <div className="flex flex-wrap gap-2">
                {complaint.returnProofUrls.map((url, index) => (
                  <a key={url} href={url} rel="noreferrer" target="_blank">
                    <img src={url} alt={`Return proof ${index + 1}`} className="h-16 w-16 rounded-md object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">
              Last updated
              {' '}
              {format(new Date(complaint.updatedAt), 'PPp')}
            </span>
            <Link
              onClick={onClose}
              to="/admin/complaints"
              className="
                inline-flex items-center gap-1 text-xs text-primary
                hover:underline
              "
            >
              Open Complaints section
              {' '}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Detail dialog — no extra API calls, item already carries all display data ──
function OrderDetailDialog({
  canCancel,
  onClose,
  row,
}: {
  canCancel: boolean;
  onClose: () => void;
  row: Row | null;
}) {
  const cancelMutation = useCancelAdminOrderMutation();

  if (!row)
    return null;

  const { item, order } = row;
  const cancelOrder = async () => {
    try {
      await cancelMutation.mutateAsync(order.id);
      toast.success('Order cancelled and items relisted');
      onClose();
    }
    catch (error) {
      toast.error(`Could not cancel order: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const shippingAddr = [
    order.shippingAddress,
    order.shippingCity,
    order.shippingPostal,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog onOpenChange={o => !o && onClose()} open={!!row}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{item.title}</DialogTitle>
          <DialogDescription>
            Order #
            {order.id.slice(0, 8)}
            {' '}
            ·
            {' '}
            {format(new Date(order.createdAt), 'PPp')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          {order.status === 'CANCELLED'
            ? <Badge variant="secondary">Order cancelled</Badge>
            : canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={cancelMutation.isPending}>
                      {cancelMutation.isPending && <Loader2 className="animate-spin" />}
                      Cancel order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel order #{order.id.slice(0, 8)}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The whole order will be marked cancelled and its sold items will be listed for sale again. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep order</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={cancelMutation.isPending}
                        onClick={(event) => {
                          event.preventDefault();
                          void cancelOrder();
                        }}
                      >
                        Yes, cancel order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                className="h-24 w-24 rounded-md object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={row.effective === 'shipped' ? 'default' : 'secondary'}
                >
                  {row.effective}
                </Badge>
                <Link
                  to={`/listing/${item.listingId}`}
                  className="
                    inline-flex items-center gap-1 text-xs text-primary
                    hover:underline
                  "
                >
                  View listing
                  {' '}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Price: Rs
                {' '}
                {item.price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="
            grid gap-4
            sm:grid-cols-2
          "
          >
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Buyer
                </p>
                <p className="text-sm font-medium">{item.buyerFullName}</p>
                {order.shippingPhone && (
                  <p className="text-xs text-muted-foreground">
                    {order.shippingPhone}
                  </p>
                )}
                <Link
                  to={`/seller/${item.buyerId}`}
                  className="
                    mt-2 inline-flex items-center gap-1 text-xs text-primary
                    hover:underline
                  "
                >
                  View profile
                  {' '}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Seller
                </p>
                <p className="text-sm font-medium">{item.sellerFullName}</p>
                <Link
                  to={`/seller/${item.sellerId}`}
                  className="
                    mt-2 inline-flex items-center gap-1 text-xs text-primary
                    hover:underline
                  "
                >
                  View profile
                  {' '}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Timeline
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Sold (order placed)
                </span>
                <span>{format(new Date(order.createdAt), 'PPp')}</span>
              </div>
              {item.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipped</span>
                  <span>{format(new Date(item.shippedAt), 'PPp')}</span>
                </div>
              )}
              {item.receivedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered</span>
                  <span>{format(new Date(item.receivedAt), 'PPp')}</span>
                </div>
              )}
              {item.expectedDelivery && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Expected delivery
                  </span>
                  <span>{format(new Date(item.expectedDelivery), 'PPp')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(item.trackingNumber
            || item.shippingMethod
            || item.proofImageUrl) && (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Shipping
                </p>
                {item.shippingMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{item.shippingMethod}</span>
                  </div>
                )}
                {item.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking</span>
                    <span className="font-mono text-xs">
                      {item.trackingNumber}
                    </span>
                  </div>
                )}
                {item.proofImageUrl && (
                  <a href={item.proofImageUrl} rel="noreferrer" target="_blank">
                    <img
                      src={item.proofImageUrl}
                      alt="Shipping proof"
                      className="mt-2 h-24 w-24 rounded-md object-cover"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {shippingAddr && (
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Shipping address
                </p>
                <p>{shippingAddr}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdminOrders;
