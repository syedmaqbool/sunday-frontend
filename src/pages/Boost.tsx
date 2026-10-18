import type { ManualPaymentSubmissionValues } from '@/components/ManualPaymentDialog';
import type { BoostPurchaseDisplayStatus } from '@/lib/boostStatus';
import type { BoostableListingItem, ListingBoost } from '@/types/boost.type';

import { useQuery } from '@tanstack/react-query';

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BoostDialog from '@/components/BoostDialog';
import Footer from '@/components/Footer';
import { ManualPaymentDialog } from '@/components/ManualPaymentDialog';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {

  getBoostPurchaseDisplayStatus,
  isBoostPaidAndWithinActiveWindow,
} from '@/lib/boostStatus';
import {
  getBoostableListingsOptions,
  getMyBoostPurchasesOptions,
  getMyBoostsOptions,
  useResubmitBoostPaymentProofMutation,
} from '@/queries/clientBoost.query';

// ─── Constants ────────────────────────────────────────────────────────────────

const placementIcon: Record<string, any> = {
  FOR_YOU: Sparkles,
  SEARCH: Search,
  TRENDING: TrendingUp,
};

const placementLabel: Record<string, string> = {
  FOR_YOU: 'Picked for You',
  SEARCH: 'Search & Browse',
  TRENDING: 'Trending Now',
};

const purchaseStatusLabel: Record<BoostPurchaseDisplayStatus, string> = {
  ACTIVE: 'Active',
  APPROVED: 'Approved',
  PENDING_REVIEW: 'Awaiting payment review',
  REFUND_REQUIRED: 'Refund required',
  REFUNDED: 'Refunded',
  REJECTED: 'Rejected',
  RESUBMISSION_REQUESTED: 'Replacement proof requested',
};

// ─── Component ────────────────────────────────────────────────────────────────

function Boost() {
  const navigate = useNavigate();
  const [purchasePage, setPurchasePage] = useState(1);
  const [resubmissionPurchaseId, setResubmissionPurchaseId] = useState<string | null>(null);

  const { data: boostsResponse, isLoading: boostsLoading }
    = useQuery(getMyBoostsOptions());
  const { data: purchasesResponse, isLoading: purchasesLoading }
    = useQuery(getMyBoostPurchasesOptions({ page: purchasePage, size: 100 }));
  const { data: listingsResponse, isLoading: listingsLoading } = useQuery(getBoostableListingsOptions());

  const allBoosts: ListingBoost[] = boostsResponse?.data ?? [];
  const purchases = purchasesResponse?.data ?? [];
  const purchasePagination = purchasesResponse?.pagination;
  const listings: BoostableListingItem[] = listingsResponse?.data ?? [];
  const resubmitPayment = useResubmitBoostPaymentProofMutation();
  const resubmissionPurchase = purchases.find(purchase => purchase.id === resubmissionPurchaseId) ?? null;

  const submitReplacementProof = async (payment: ManualPaymentSubmissionValues) => {
    const listingId = resubmissionPurchase?.boosts[0]?.listingId;
    if (!resubmissionPurchase || !listingId)
      return;

    const response = await resubmitPayment.mutateAsync({
      listingId,
      purchaseId: resubmissionPurchase.id,
      ...payment,
    });
    toast.success(response.data.status === 'PENDING_REVIEW'
      ? 'Replacement proof submitted. Your payment is awaiting review.'
      : `Payment status: ${response.data.status.replaceAll('_', ' ').toLowerCase()}.`);
    setResubmissionPurchaseId(null);
  };

  const now = useMemo(() => Date.now(), []);
  const activeBoosts = allBoosts.filter(
    b => isBoostPaidAndWithinActiveWindow(b, now),
  );
  const expiredBoosts = allBoosts.filter(
    b => b.paymentStatus === 'PAID' && new Date(b.endsAt).getTime() < now,
  );

  // group active boosts by listingId for the listings section
  const boostsByListing = new Map<string, ListingBoost[]>();
  for (const b of activeBoosts) {
    const array = boostsByListing.get(b.listingId) ?? [];
    array.push(b);
    boostsByListing.set(b.listingId, array);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Boost Listings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Promote your products in Trending, Picked for You, and Search
              results.
            </p>
          </div>
        </div>

        {/* Active boosts summary */}
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Active Boosts (
            {activeBoosts.length}
            )
          </h2>
          {boostsLoading
            ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (activeBoosts.length === 0
                ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No active boosts. Pick a listing below to start promoting.
                    </p>
                  )
                : (
                    <div className="mt-3 space-y-2">
                      {activeBoosts.map((b) => {
                        const Icon = placementIcon[b.placement] ?? Rocket;
                        const listing = listings.find(l => l.id === b.listingId);
                        return (
                          <Card key={b.id}>
                            <CardContent className="flex items-center gap-3 p-3">
                              <Icon className="h-4 w-4 shrink-0 text-primary" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {listing?.title ?? 'Listing'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {placementLabel[b.placement] ?? b.placement}
                                  {' '}
                                  · ends
                                  {' '}
                                  {new Date(b.endsAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                Rs
                                {' '}
                                {Number(b.pricePaid).toFixed(2)}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Boost Purchase History
          </h2>
          {purchasesLoading
            ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : purchases.length === 0
              ? (
                  <p className="mt-3 text-sm text-muted-foreground">No boost purchases yet.</p>
                )
              : (
                  <div className="mt-3 space-y-3">
                    {purchases.map((purchase) => {
                      const listingId = purchase.boosts[0]?.listingId;
                      const listing = listings.find(item => item.id === listingId);
                      const status = getBoostPurchaseDisplayStatus(purchase);
                      const active = status === 'ACTIVE';
                      const statusLabel = purchaseStatusLabel[status];
                      const canResubmit = purchase.status === 'RESUBMISSION_REQUESTED'
                        && purchase.paymentSubmission?.status === 'RESUBMISSION_REQUESTED'
                        && Boolean(listingId);

                      return (
                        <Card key={purchase.id}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {listing?.title ?? 'Listing'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {purchase.boosts.map(boost => `${placementLabel[boost.placement] ?? boost.placement}${boost.packageName ? ` · ${boost.packageName}` : ''}`).join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={active ? 'default' : 'secondary'}>{statusLabel}</Badge>
                                <Badge variant="outline">
                                  Rs
                                  {Number(purchase.amount).toFixed(2)}
                                </Badge>
                              </div>
                            </div>

                            {purchase.paymentSubmission && (
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>
                                  Latest proof:
                                  {' '}
                                  {purchase.paymentSubmission.status.replaceAll('_', ' ').toLowerCase()}
                                </p>
                                {purchase.paymentSubmission.reviewNote && (
                                  <p>
                                    Review note:
                                    {' '}
                                    {purchase.paymentSubmission.reviewNote}
                                  </p>
                                )}
                                {purchase.paymentSubmission.reviewedAt && (
                                  <p>
                                    Reviewed
                                    {' '}
                                    {new Date(purchase.paymentSubmission.reviewedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}

                            {purchase.status === 'REFUND_REQUIRED' && (
                              <p className="text-sm text-destructive">
                                This boost was not activated. A refund is required.
                              </p>
                            )}
                            {purchase.refundCompletedAt && (
                              <p className="text-sm text-muted-foreground">
                                Refund completed
                                {' '}
                                {new Date(purchase.refundCompletedAt).toLocaleString()}
                              </p>
                            )}
                            {canResubmit && (
                              <Button
                                onClick={() => setResubmissionPurchaseId(purchase.id)}
                                size="sm"
                                type="button"
                              >
                                Resubmit payment proof
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
          {purchasePagination && purchasePagination.lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                onClick={() => setPurchasePage(purchasePagination.prevPage ?? 1)}
                aria-label="Previous page"
                disabled={!purchasePagination.prevPage || purchasesLoading}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Showing page
                {' '}
                {purchasePagination.currentPage}
                {' '}
                of
                {' '}
                {purchasePagination.lastPage}
              </p>
              <Button
                onClick={() => setPurchasePage(purchasePagination.nextPage ?? purchasePagination.currentPage)}
                aria-label="Next page"
                disabled={!purchasePagination.nextPage || purchasesLoading}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Choose a listing to boost */}
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Your Approved Listings
          </h2>
          {listingsLoading
            ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (listings.length === 0
                ? (
                    <div className="mt-6 flex flex-col items-center py-12 text-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 font-heading text-base font-semibold text-foreground">
                        No approved listings to boost
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Once a listing is approved, you can promote it here.
                      </p>
                      <Button
                        onClick={() => navigate('/create-listing')}
                        className="mt-4"
                      >
                        Create Listing
                      </Button>
                    </div>
                  )
                : (
                    <div className="mt-3 space-y-2">
                      {listings.map((l) => {
                        const active = boostsByListing.get(l.id) ?? [];
                        return (
                          <Card key={l.id}>
                            <CardContent className="flex items-center gap-3 p-3">
                              <img
                                src={l.coverImage.url || '/placeholder.svg'}
                                alt={l.title}
                                className="h-14 w-14 rounded-md object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-foreground">
                                  {l.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Rs
                                  {' '}
                                  {Number(l.price).toLocaleString()}
                                  {active.length > 0 && (
                                    <span className="ml-2 text-primary">
                                      ·
                                      {' '}
                                      {active.length}
                                      {' '}
                                      active boost
                                      {active.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <BoostDialog listingId={l.id} listingTitle={l.title} />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
        </section>

        {/* Boost history */}
        {expiredBoosts.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Boost History
            </h2>
            <div className="mt-3 space-y-2">
              {expiredBoosts.slice(0, 10).map((b) => {
                const listing = listings.find(l => l.id === b.listingId);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {listing?.title ?? 'Listing'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {placementLabel[b.placement] ?? b.placement}
                        {' '}
                        · ended
                        {' '}
                        {new Date(b.endsAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Rs
                      {' '}
                      {Number(b.pricePaid).toFixed(2)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <ManualPaymentDialog
        onOpenChange={open => !open && setResubmissionPurchaseId(null)}
        onSubmit={submitReplacementProof}
        mode="resubmit"
        open={Boolean(resubmissionPurchase)}
        submitting={resubmitPayment.isPending}
      />
      <Footer />
    </div>
  );
}

export default Boost;
