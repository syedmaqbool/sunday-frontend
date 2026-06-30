import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  ArrowUpDown,
  CheckCircle,
  Loader2,
  Star,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import {
  getMyReviewedOfferIdsOptions,
  getReceivedOffersOptions,
  offersQueryKey,
} from '@/queries/offers.query';
import {
  acceptOffer,
  counterOffer,
  rejectOffer,
} from '@/services/offers.service';

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
}

type SortOption = 'newest' | 'price_desc';

export function ReceivedOffers({ listingId }: ReceivedOffersProps = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [counterDialog, setCounterDialog] = useState<any | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const { data: received = [], isLoading } = useQuery(getReceivedOffersOptions(user?.id, listingId));

  const { data: myReviews = [] } = useQuery(getMyReviewedOfferIdsOptions(user?.id));

  const respondToOffer = useMutation({
    mutationFn: ({
      id,
      action,
      counterAmount: counter,
    }: {
      id: string;
      action: 'accept' | 'counter' | 'reject';
      counterAmount?: number;
    }) => {
      if (action === 'accept')
        return acceptOffer(id);
      if (action === 'reject')
        return rejectOffer(id);
      return counterOffer(id, { counterAmount: counter! });
    },
    onError: () => toast.error('Failed to update offer'),
    onSuccess: (_, { action }) => {
      toast.success(`Offer ${action}ed`);
      if (action === 'accept') {
        toast.info(
          'Listing reserved for the buyer for 6 hours. They have until then to complete the purchase.',
        );
      }
      queryClient.invalidateQueries({ queryKey: offersQueryKey.received(user?.id, listingId) });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setCounterDialog(null);
      setCounterAmount('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (received.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No offers received yet
      </div>
    );
  }

  const sortedOffers = received.toSorted((a, b) => {
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
          <Card key={offer.id}>
            <CardContent className="
              flex flex-col gap-4 p-4
              sm:flex-row sm:items-center
            "
            >
              <img
                src="/placeholder.svg"
                alt=""
                className="h-16 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {offer.listingTitle ?? 'Listing'}
                  </h3>
                  <Badge variant={statusBadge(offer.status)}>
                    {offer.status}
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
                      respondToOffer.mutate({
                        id: offer.id,
                        action: 'accept',
                      })}
                    disabled={respondToOffer.isPending}
                    size="sm"
                    className="gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {' '}
                    Accept
                  </Button>
                  <Button
                    onClick={() => setCounterDialog(offer)}
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
                      respondToOffer.mutate({
                        id: offer.id,
                        action: 'reject',
                      })}
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
                && !myReviews.includes(offer.id)
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
              {offer.status === 'ACCEPTED' && myReviews.includes(offer.id) && (
                <span className="text-xs italic text-muted-foreground">
                  ✓ Reviewed
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        onOpenChange={open => !open && setCounterDialog(null)}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your counter price (PKR)</Label>
              <Input
                onChange={event => setCounterAmount(event.target.value)}
                value={counterAmount}
                min="1"
                placeholder={`e.g. ${counterDialog?.listingPrice}`}
                step="0.01"
                type="number"
              />
            </div>
            <Button
              onClick={() =>
                counterDialog
                && respondToOffer.mutate({
                  id: counterDialog.id,
                  action: 'counter',
                  counterAmount: Number(counterAmount),
                })}
              disabled={
                !counterAmount
                || Number(counterAmount) <= 0
                || respondToOffer.isPending
              }
              className="w-full"
            >
              {respondToOffer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Counter Offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReceivedOffers;
