import type { AdminOrder, AdminOrderItem } from '@/types/admin/order';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, startOfMonth, subDays } from 'date-fns';
import { ExternalLink, Loader2, Package } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAdminOrdersOptions,
  getAdminReservedListingsOptions,
} from '@/queries/useAdminOrders';

// ── Display types ─────────────────────────────────────────────────────────────
type EffectiveStatus = 'delivered' | 'shipped' | 'sold';
type StatusFilter = 'all' | 'reserved' | EffectiveStatus;
type DateFilter = '7d' | 'all' | 'month' | 'today';

interface Row {
  orderId: string;
  buyerName: string;
  city: string;
  created_at: string;
  effective: EffectiveStatus;
  item: AdminOrderItem;
  order: AdminOrder;
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
function effectiveStatus(status: AdminOrderItem['status']): EffectiveStatus {
  if (status === 'CONFIRMED')
    return 'sold';
  if (status === 'SHIPPED')
    return 'shipped';
  return 'delivered';
}

// ── Component ─────────────────────────────────────────────────────────────────
function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selected, setSelected] = useState<Row | null>(null);

  const { data: orders = [], isLoading } = useQuery(getAdminOrdersOptions());
  const { data: reservedListings = [], isLoading: reservedLoading } = useQuery(
    getAdminReservedListingsOptions(statusFilter === 'reserved'),
  );

  // Flatten orders → item rows
  const rows = useMemo<Row[]>(() => {
    const start = dateFilterStart(dateFilter);
    const flat: Row[] = [];

    for (const o of orders) {
      if (start && new Date(o.createdAt) < start)
        continue;
      const buyerName
        = [o.shippingFirstName, o.shippingLastName].filter(Boolean).join(' ')
          || '—';

      for (const item of o.items) {
        const eff = effectiveStatus(item.status);
        if (
          statusFilter !== 'all'
          && statusFilter !== 'reserved'
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

  // KPI counts — aggregate counts come directly from backend's itemStatusCounts per order
  const counts = useMemo(() => {
    const start = dateFilterStart(dateFilter);
    let sold = 0;
    let shipped = 0;
    let received = 0;
    let completed = 0;

    for (const o of orders) {
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
                                <TableHead>Item</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tracking</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map(r => (
                                <TableRow
                                  key={r.item.id}
                                  onClick={() => setSelected(r)}
                                  className="cursor-pointer"
                                >
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
                              ))}
                            </TableBody>
                          </Table>
                        ))}
              </CardContent>
            </Card>
          )}

      <OrderDetailDialog onClose={() => setSelected(null)} row={selected} />
    </div>
  );
}

// ── Detail dialog — no extra API calls, item already carries all display data ──
function OrderDetailDialog({
  onClose,
  row,
}: {
  onClose: () => void;
  row: Row | null;
}) {
  if (!row)
    return null;

  const { item, order } = row;
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
                  variant={item.status === 'SHIPPED' ? 'default' : 'secondary'}
                >
                  {effectiveStatus(item.status)}
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
