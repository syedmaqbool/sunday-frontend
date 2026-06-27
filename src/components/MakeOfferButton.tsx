import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { offersQueryKey } from '@/queries/useOffers';
import { getBuyerListingOffersOptions } from '@/queries/useOffers';
import {
  acceptCounterOffer,
  createOffer,
  withdrawOffer as withdrawOfferRequest,
} from '@/services/offers.service';

interface MakeOfferProps {
  listingId: string;
  sellerId: string;
  listingPrice: number;
  listingTitle: string;
}

function statusBadge(s: string) {
  const map: Record<string, 'default' | 'destructive' | 'secondary'> = {
    ACCEPTED: 'default',
    COUNTERED: 'secondary',
    PENDING: 'secondary',
    REJECTED: 'destructive',
    WITHDRAWN: 'destructive',
  };
  return map[s] ?? 'secondary';
}

export function MakeOfferButton({
  listingId,
  sellerId,
  listingPrice,
  listingTitle,
}: MakeOfferProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  // Fetch existing offers from this buyer on this listing
  const { data: existingOffers = [] } = useQuery(
    getBuyerListingOffersOptions(listingId, user?.id),
  );

  const invalidateOffers = () =>
    queryClient.invalidateQueries({
      queryKey: offersQueryKey.buyerListing(listingId, user?.id),
    });

  const submitOffer = useMutation({
    mutationFn: () => createOffer(listingId, { amount: Number(amount) }),
    onError: (error: any) => toast.error(error.message),
    onSuccess: () => {
      trackEvent('make_offer', {
        listing_id: listingId,
        listing_price: listingPrice,
        listing_title: listingTitle,
        offer_amount: Number(amount),
      });
      toast.success('Offer sent!');
      invalidateOffers();
      setAmount('');
    },
  });

  const acceptCounter = useMutation({
    mutationFn: (offerId: string) => acceptCounterOffer(offerId),
    onError: (error: any) => toast.error(error.message),
    onSuccess: () => {
      toast.success(
        'Counter-offer accepted! Check your Messages to chat with the seller.',
      );
      invalidateOffers();
    },
  });

  const withdrawOffer = useMutation({
    mutationFn: (offerId: string) => withdrawOfferRequest(offerId),
    onError: (error: any) => toast.error(error.message),
    onSuccess: () => {
      toast.success('Offer withdrawn');
      invalidateOffers();
    },
  });

  if (!user) {
    return (
      <Button
        onClick={() => navigate('/auth')}
        size="lg"
        variant="outline"
        className="
          w-full gap-2
          sm:w-auto
        "
      >
        <MessageSquare className="h-4 w-4" />
        {' '}
        Make Offer
      </Button>
    );
  }

  const activeOffer = existingOffers.find(
    o => o.status === 'pending' || o.status === 'countered',
  );

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="
            w-full gap-2
            sm:w-auto
          "
        >
          <MessageSquare className="h-4 w-4" />
          {' '}
          Make Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {activeOffer ? 'Your Offer' : 'Make an Offer'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {listingTitle}
            {' '}
            · Listed at Rs
            {listingPrice.toLocaleString()}
          </p>
        </DialogHeader>

        {existingOffers.length > 0 && (
          <div className="my-2 max-h-48 space-y-2 overflow-y-auto pr-1">
            {existingOffers.map(offer => (
              <div
                key={offer.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Rs
                      {' '}
                      {offer.amount.toLocaleString()}
                    </span>
                    <Badge variant={statusBadge(offer.status)}>
                      {offer.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(offer.createdAt), 'MMM d')}
                  </span>
                </div>
                {offer.status === 'COUNTERED' && offer.counterAmount && (
                  <div className="mt-2 rounded-md border border-border/60 bg-muted p-2">
                    <p className="text-xs font-semibold text-foreground">
                      Counter: Rs
                      {' '}
                      {offer.counterAmount.toLocaleString()}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => acceptCounter.mutate(offer.id)}
                        disabled={acceptCounter.isPending}
                        size="sm"
                        className="h-8 text-xs"
                      >
                        Accept Rs
                        {' '}
                        {offer.counterAmount.toLocaleString()}
                      </Button>
                      <Button
                        onClick={() => withdrawOffer.mutate(offer.id)}
                        disabled={withdrawOffer.isPending}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
                {offer.status === 'PENDING' && (
                  <Button
                    onClick={() => withdrawOffer.mutate(offer.id)}
                    disabled={withdrawOffer.isPending}
                    size="sm"
                    variant="ghost"
                    className="
                      mt-2 h-7 px-2 text-xs text-destructive
                      hover:bg-destructive/10
                    "
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {!activeOffer && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Your offer (PKR)</Label>
              <Input
                id="offer-amount"
                onChange={event => setAmount(event.target.value)}
                value={amount}
                min="1"
                placeholder={`e.g. ${Math.round(listingPrice * 0.8)}`}
                type="number"
              />
            </div>
            <Button
              onClick={() => submitOffer.mutate()}
              disabled={
                !amount || Number(amount) <= 0 || submitOffer.isPending
              }
              className="w-full"
            >
              {submitOffer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Offer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
