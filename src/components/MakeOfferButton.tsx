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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';
//  Mock config  import
import { isMockDataEnabled } from '@/lib/mockConfig';
import { getBuyerListingOffersOptions } from '@/queries/useOffers';

interface Offer {
  id: string;
  amount: number;
  counter_amount: number | null;
  created_at: string;
  message: string;
  seller_message: string;
  status: string;
  updated_at: string;
}

interface MakeOfferProps {
  listingId: string;
  sellerId: string;
  listingPrice: number;
  listingTitle: string;
}

function statusBadge(s: string) {
  const map: Record<string, 'default' | 'destructive' | 'secondary'> = {
    accepted: 'default',
    countered: 'secondary',
    pending: 'secondary',
    rejected: 'destructive',
    withdrawn: 'destructive',
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
  const [message, setMessage] = useState('');

  //  Local State to manage live session mock offers mock lifecycle
  const [localMockOffers, setLocalMockOffers] = useState<Offer[]>([
    {
      id: 'mock-offer-init-1',
      amount: Math.round(listingPrice * 0.75),
      counter_amount: Math.round(listingPrice * 0.9),
      created_at: new Date(Date.now() - 86_400_000).toISOString(),
      message: 'Is this price negotiable?',
      seller_message: 'Can do slightly lower but not that much. Let me know!',
      status: 'countered',
      updated_at: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ]);

  // Fetch existing offers from this buyer on this listing
  const { data: existingOffers = [] } = useQuery(
    getBuyerListingOffersOptions(listingId, user?.id, localMockOffers),
  );

  const submitOffer = useMutation({
    mutationFn: async () => {
      if (isMockDataEnabled) {
        // Mocking mutation delay
        await new Promise(resolve => setTimeout(resolve, 600));
        const newOffer: Offer = {
          id: `mock-offer-${Date.now()}`,
          amount: Number(amount),
          counter_amount: null,
          created_at: new Date().toISOString(),
          message,
          seller_message: '',
          status: 'pending',
          updated_at: new Date().toISOString(),
        };
        setLocalMockOffers(previous => [newOffer, ...previous]);
        return;
      }

      const { error } = await supabase.from('offers').insert({
        amount: Number(amount),
        buyer_id: user!.id,
        listing_id: listingId,
        message,
        seller_id: sellerId,
      });
      if (error)
        throw error;
    },
    onError: (error: any) => toast.error(error.message),
    onSuccess: () => {
      trackEvent('make_offer', {
        listing_id: listingId,
        listing_price: listingPrice,
        listing_title: listingTitle,
        offer_amount: Number(amount),
      });
      toast.success('Offer sent!');
      queryClient.invalidateQueries({ queryKey: ['my-offers', listingId] });
      setAmount('');
      setMessage('');
    },
  });

  const acceptCounter = useMutation({
    mutationFn: async (offerId: string) => {
      if (isMockDataEnabled) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setLocalMockOffers(previous =>
          previous.map(o =>
            o.id === offerId
              ? {
                  ...o,
                  status: 'accepted',
                  updated_at: new Date().toISOString(),
                }
              : o,
          ),
        );
        return;
      }

      const { error } = await supabase
        .from('offers')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', offerId);
      if (error)
        throw error;

      await supabase.from('conversations').insert({
        buyer_id: user!.id,
        listing_id: listingId,
        offer_id: offerId,
        seller_id: sellerId,
      });
    },
    onSuccess: () => {
      toast.success(
        'Counter-offer accepted! Check your Messages to chat with the seller.',
      );
      queryClient.invalidateQueries({ queryKey: ['my-offers', listingId] });
    },
  });

  const withdrawOffer = useMutation({
    mutationFn: async (offerId: string) => {
      if (isMockDataEnabled) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setLocalMockOffers(previous =>
          previous.map(o =>
            o.id === offerId
              ? {
                  ...o,
                  status: 'withdrawn',
                  updated_at: new Date().toISOString(),
                }
              : o,
          ),
        );
        return;
      }

      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', offerId);
      if (error)
        throw error;
    },
    onSuccess: () => {
      toast.success('Offer withdrawn');
      queryClient.invalidateQueries({ queryKey: ['my-offers', listingId] });
    },
  });

  // Agar mock data active ho toh auth check bypass ho jaye
  if (!user && !isMockDataEnabled) {
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
                    {format(new Date(offer.created_at), 'MMM d')}
                  </span>
                </div>
                {offer.message && (
                  <p className="mt-1 rounded bg-muted/40 p-1.5 text-xs text-muted-foreground">
                    {offer.message}
                  </p>
                )}
                {offer.status === 'countered' && offer.counter_amount && (
                  <div className="mt-2 rounded-md border border-border/60 bg-muted p-2">
                    <p className="text-xs font-semibold text-foreground">
                      Counter: Rs
                      {' '}
                      {offer.counter_amount.toLocaleString()}
                    </p>
                    {offer.seller_message && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        "
                        {offer.seller_message}
                        "
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => acceptCounter.mutate(offer.id)}
                        disabled={acceptCounter.isPending}
                        size="sm"
                        className="h-8 text-xs"
                      >
                        Accept Rs
                        {' '}
                        {offer.counter_amount.toLocaleString()}
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
                {offer.status === 'pending' && (
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
            <div className="space-y-2">
              <Label htmlFor="offer-message">Message (optional)</Label>
              <Textarea
                id="offer-message"
                onChange={event => setMessage(event.target.value)}
                value={message}
                maxLength={500}
                placeholder="e.g. Would you consider this? I can pay immediately."
                rows={2}
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
