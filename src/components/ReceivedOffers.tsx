import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  ArrowUpDown,
  CheckCircle,
  Loader2,
  Star,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ReviewForm } from '@/components/ReviewForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/lib/errorToast';
import { formatEnumLabel } from '@/lib/utilities';
import {
  getMyReviewedOfferIdsOptions,
  getReceivedOfferSelectionOptions,
  getReceivedOffersOptions,
  useRespondToOfferMutation,
} from '@/queries/offers.query';

function statusBadge(s: string) {
  const map: Record<string, 'default' | 'destructive' | 'secondary'> = {
    ACCEPTED: 'default',
    COUNTERED: 'secondary',
    EXPIRED: 'destructive',
    PENDING: 'secondary',
    REJECTED: 'destructive',
    WITHDRAWN: 'destructive',
  };
  return map[s] ?? 'secondary';
}

interface ReceivedOffersProps {
  listingId?: string;
  selectedOfferId?: string | null;
}

type SortOption = 'newest' | 'price_desc';

const counterOfferSchema = z.object({
  counterAmount: z.string().refine(value => Number.isFinite(Number(value)) && Number(value) > 0, 'Counter price must be greater than zero.'),
});

type CounterOfferFormValues = z.infer<typeof counterOfferSchema>;

export function ReceivedOffers({ listingId, selectedOfferId }: ReceivedOffersProps = {}) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [counterDialog, setCounterDialog] = useState<any | null>(null);
  const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const form = useForm<CounterOfferFormValues>({
    defaultValues: { counterAmount: '' },
    resolver: zodResolver(counterOfferSchema),
  });

  const closeCounterDialog = () => {
    setCounterDialog(null);
    form.reset({ counterAmount: '' });
  };

  const { data: receivedResponse, isLoading } = useQuery(getReceivedOffersOptions(user?.id, listingId));
  const received = (receivedResponse?.data ?? []).filter(
    offer => !listingId || offer.listingId === listingId,
  );
  const { data: selectedOfferResponse, isLoading: loadingSelectedOffer } = useQuery(
    getReceivedOfferSelectionOptions(selectedOfferId ?? null, user?.id),
  );
  const selectedOffer = selectedOfferResponse?.data.find(offer => offer.id === selectedOfferId);
  const offersToDisplay = selectedOffer && received.every(offer => offer.id !== selectedOffer.id)
    ? [...received, selectedOffer]
    : received;

  useEffect(() => {
    if (
      !selectedOfferId
      || isLoading
      || loadingSelectedOffer
      || receivedResponse?.data?.some(offer => offer.id === selectedOfferId && (!listingId || offer.listingId === listingId))
      || selectedOffer
    ) {
      return;
    }
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('offer');
    setSearchParams(nextSearchParams, { replace: true });
  }, [isLoading, listingId, loadingSelectedOffer, receivedResponse?.data, searchParams, selectedOffer, selectedOfferId, setSearchParams]);

  const { data: myReviewsResponse } = useQuery(getMyReviewedOfferIdsOptions(user?.id));
  const myReviews = new Set((myReviewsResponse?.data ?? [])
    .map(review => review.offerId)
    .filter((offerId): offerId is string => offerId !== null));

  const respondToOffer = useRespondToOfferMutation(user?.id, listingId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (offersToDisplay.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No offers received yet
      </div>
    );
  }

  const sortedOffers = offersToDisplay.toSorted((a, b) => {
    if (sortBy === 'price_desc')
      return b.amount - a.amount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const sortLabel: Record<SortOption, string> = {
    newest: 'Newest First',
    price_desc: 'Highest to Lowest Price',
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortLabel[sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price_desc')}>
              Highest to Lowest Price
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-3">
        {sortedOffers.map(offer => (
          <Card
            key={offer.id}
            data-testid={offer.id === selectedOfferId ? 'selected-offer' : undefined}
            className={offer.id === selectedOfferId ? 'ring-2 ring-primary' : undefined}
          >
            <CardContent className="
              flex flex-col gap-4 p-4
              sm:flex-row sm:items-center
            "
            >
              <img
                src={offer.coverImage?.url || '/placeholder.svg'}
                alt={offer.listingTitle ?? 'Listing'}
                className="h-16 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {offer.listingTitle ?? 'Listing'}
                  </h3>
                  <Badge variant={statusBadge(offer.status)}>
                    {formatEnumLabel(offer.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  From
                  {' '}
                  {offer.buyerFullName || 'Buyer'}
                  {' '}
                  · Listed R
                  {' '}
                  {offer.listingPrice?.toLocaleString()}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  Offer: R
                  {' '}
                  {offer.amount.toLocaleString()}
                </p>
                {offer.counterAmount && (
                  <p className="text-xs text-muted-foreground">
                    Your counter: R
                    {' '}
                    {offer.counterAmount.toLocaleString()}
                  </p>
                )}
              </div>
              {offer.status === 'PENDING' && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    onClick={() =>
                      respondToOffer.mutate(
                        {
                          id: offer.id,
                          action: 'accept',
                        },
                        {
                          onError: (error: unknown) => showErrorToast(error, 'Failed to accept offer'),
                          onSuccess: () => {
                            toast.success('Offer accepted');
                            toast.info('The buyer has 24 hours to submit payment proof.');
                            closeCounterDialog();
                          },
                        },
                      )}
                    disabled={respondToOffer.isPending}
                    size="sm"
                    className="gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {' '}
                    Accept
                  </Button>
                  <Button
                    onClick={() => {
                      form.reset({ counterAmount: '' });
                      setCounterDialog(offer);
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {' '}
                    Counter
                  </Button>
                  <Button
                    onClick={() =>
                      respondToOffer.mutate(
                        {
                          id: offer.id,
                          action: 'reject',
                        },
                        {
                          onError: (error: unknown) => showErrorToast(error, 'Failed to reject offer'),
                          onSuccess: () => {
                            toast.success('Offer rejected');
                            closeCounterDialog();
                          },
                        },
                      )}
                    disabled={respondToOffer.isPending}
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {' '}
                    Reject
                  </Button>
                </div>
              )}
              {offer.status === 'ACCEPTED'
                && !myReviews.has(offer.id)
                && (reviewingOffer === offer.id
                  ? (
                      <div className="mt-3 w-full border-t border-border pt-3">
                        <p className="mb-2 text-xs font-medium text-foreground">
                          Rate this buyer
                        </p>
                        <ReviewForm
                          listingId={offer.listingId}
                          offerId={offer.id}
                          reviewedId={offer.buyerId}
                          onSuccess={() => setReviewingOffer(null)}
                          role="SELLER"
                        />
                      </div>
                    )
                  : (
                      <Button
                        onClick={() => setReviewingOffer(offer.id)}
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                      >
                        <Star className="h-3.5 w-3.5" />
                        {' '}
                        Leave Review
                      </Button>
                    ))}
              {offer.status === 'ACCEPTED' && myReviews.has(offer.id) && (
                <span className="text-xs italic text-muted-foreground">
                  ✓ Reviewed
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        onOpenChange={open => !open && closeCounterDialog()}
        open={!!counterDialog}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Counter Offer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {counterDialog?.listingTitle}
              {' '}
              · Offered R
              {' '}
              {counterDialog?.amount.toLocaleString()}
            </p>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) => {
              if (!counterDialog)
                return;
              respondToOffer.mutate(
                { id: counterDialog.id, action: 'counter', counterAmount: Number(values.counterAmount) },
                {
                  onError: (error: unknown) => showErrorToast(error, 'Failed to counter offer'),
                  onSuccess: () => {
                    toast.success('Offer countered');
                    closeCounterDialog();
                  },
                },
              );
            }, errors => toast.error(Object.values(errors)[0]?.message ?? 'Enter a valid counter price.'))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Your counter price (PKR)</Label>
              <Controller
                name="counterAmount"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    min="1"
                    placeholder={`e.g. ${counterDialog?.listingPrice}`}
                    step="0.01"
                    type="number"
                  />
                )}
              />
            </div>
            <Button
              disabled={respondToOffer.isPending}
              type="submit"
              className="w-full"
            >
              {respondToOffer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Counter Offer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReceivedOffers;
