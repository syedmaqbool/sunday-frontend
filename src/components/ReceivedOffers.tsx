import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  ArrowUpDown,
  CheckCircle,
  Loader2,
  Star,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OfferWithListing {
  id: string;
  amount: number;
  buyer_id: string;
  buyer_profile?: { full_name: string | null } | null;
  counter_amount: number | null;
  created_at: string;
  listing_id: string;
  listings: {
    brand: string;
    images: string[];
    price: number;
    title: string;
  } | null;
  message: string;
  seller_id: string;
  seller_message: string;
  status: string;
  updated_at: string;
}

function statusBadge(s: string) {
  const map: Record<string, 'default' | 'destructive' | 'secondary'> = {
    accepted: 'default',
    countered: 'secondary',
    expired: 'destructive',
    pending: 'secondary',
    rejected: 'destructive',
    withdrawn: 'destructive',
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
  const [counterDialog, setCounterDialog] = useState<OfferWithListing | null>(
    null,
  );
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const { data: received = [], isLoading } = useQuery({
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('offers')
        .select('*, listings(title, price, images, brand)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      if (listingId)
        query = query.eq('listing_id', listingId);
      const { data, error } = await query;
      if (error)
        throw error;
      const buyerIds = [...new Set((data ?? []).map((o: any) => o.buyer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', buyerIds);
      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      return (data ?? []).map((o: any) => ({
        ...o,
        buyer_profile: profileMap.get(o.buyer_id) ?? null,
      })) as OfferWithListing[];
    },
    queryKey: ['offers-received', user?.id, listingId ?? 'all'],
  });

  const { data: myReviews = [] } = useQuery({
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('offer_id')
        .eq('reviewer_id', user!.id);
      if (error)
        throw error;
      return (data ?? []).map((r: any) => r.offer_id as string);
    },
    queryKey: ['reviews', 'mine', user?.id],
  });

  useEffect(() => {
    if (!user)
      return;
    const channel = supabase
      .channel('offers-received-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['offers-received'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const respondToOffer = useMutation({
    mutationFn: async ({
      id,
      counter_amount,
      seller_message,
      status,
    }: {
      id: string;
      counter_amount?: number;
      seller_message?: string;
      status: string;
    }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (counter_amount)
        update.counter_amount = counter_amount;
      if (seller_message)
        update.seller_message = seller_message;
      const { error } = await supabase
        .from('offers')
        .update(update)
        .eq('id', id);
      if (error)
        throw error;

      if (status === 'accepted') {
        const offer = received.find(o => o.id === id);
        if (offer) {
          await supabase.from('conversations').insert({
            buyer_id: offer.buyer_id,
            listing_id: offer.listing_id,
            offer_id: offer.id,
            seller_id: offer.seller_id,
          });
          // Listing status -> 'reserved' is handled automatically by DB trigger.
        }
      }
    },
    onError: () => toast.error('Failed to update offer'),
    onSuccess: (_, { status }) => {
      toast.success(`Offer ${status}`);
      if (status === 'accepted') {
        toast.info(
          'Listing reserved for the buyer for 6 hours. They have until then to complete the purchase.',
        );
      }
      queryClient.invalidateQueries({ queryKey: ['offers-received'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setCounterDialog(null);
      setCounterAmount('');
      setCounterMessage('');
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
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
                src={offer.listings?.images?.[0] || '/placeholder.svg'}
                alt=""
                className="h-16 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {offer.listings?.title ?? 'Listing'}
                  </h3>
                  <Badge variant={statusBadge(offer.status)}>
                    {offer.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  From
                  {' '}
                  {offer.buyer_profile?.full_name || 'Buyer'}
                  {' '}
                  · Listed R
                  {' '}
                  {offer.listings?.price?.toLocaleString()}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  Offer: R
                  {' '}
                  {offer.amount.toLocaleString()}
                </p>
                {offer.message && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    "
                    {offer.message}
                    "
                  </p>
                )}
                {offer.counter_amount && (
                  <p className="text-xs text-muted-foreground">
                    Your counter: R
                    {' '}
                    {offer.counter_amount.toLocaleString()}
                  </p>
                )}
              </div>
              {offer.status === 'pending' && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    onClick={() =>
                      respondToOffer.mutate({
                        id: offer.id,
                        status: 'accepted',
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
                        status: 'rejected',
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
              {offer.status === 'accepted'
                && !myReviews.includes(offer.id)
                && (reviewingOffer === offer.id
                  ? (
                      <div className="mt-3 w-full border-t border-border pt-3">
                        <p className="mb-2 text-xs font-medium text-foreground">
                          Rate this buyer
                        </p>
                        <ReviewForm
                          listingId={offer.listing_id}
                          offerId={offer.id}
                          reviewedId={offer.buyer_id}
                          onSuccess={() => setReviewingOffer(null)}
                          role="seller"
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
              {offer.status === 'accepted' && myReviews.includes(offer.id) && (
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
              {counterDialog?.listings?.title}
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
                placeholder={`e.g. ${counterDialog?.listings?.price}`}
                step="0.01"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                onChange={event => setCounterMessage(event.target.value)}
                value={counterMessage}
                maxLength={500}
                placeholder="e.g. I can do this price if you're still interested"
                rows={2}
              />
            </div>
            <Button
              onClick={() =>
                counterDialog
                && respondToOffer.mutate({
                  id: counterDialog.id,
                  counter_amount: Number(counterAmount),
                  seller_message: counterMessage,
                  status: 'countered',
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
