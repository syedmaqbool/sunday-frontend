import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { getBuyerListingOffersOptions, offersQueryKey } from '@/queries/offers.query';
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

const offerSchema = z.object({
  amount: z.string().refine(value => Number(value) > 0, 'Offer must be greater than 0.'),
  message: z.string().max(500).optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

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
  sellerId: _sellerId,
  listingPrice,
  listingTitle,
}: MakeOfferProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<OfferFormValues>({
    defaultValues: { amount: '', message: '' },
    mode: 'all',
    resolver: zodResolver(offerSchema),
  });
  const { control, formState: { errors }, handleSubmit, reset, watch } = form;
  const amount = watch('amount');

  const { data: existingOffers = [] } = useQuery(getBuyerListingOffersOptions(listingId, user?.id));

  const invalidateOffers = () =>
    queryClient.invalidateQueries({
      queryKey: offersQueryKey.buyerListing(listingId, user?.id),
    });

  const submitOffer = useMutation({
    mutationFn: (values: OfferFormValues) =>
      createOffer(listingId, { amount: Number(values.amount), message: values.message }),
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
      reset();
    },
  });

  const onSubmit: SubmitHandler<OfferFormValues> = values =>
    submitOffer.mutate(values);

  const acceptCounter = useMutation({
    mutationFn: (offerId: string) => acceptCounterOffer(offerId),
    onError: (error: any) => toast.error(error.message),
    onSuccess: () => {
      toast.success('Counter-offer accepted! Check your Messages to chat with the seller.');
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
        className="w-full gap-2 sm:w-auto"
      >
        <MessageSquare className="h-4 w-4" /> Make Offer
      </Button>
    );
  }

  const activeOffer = existingOffers.find(
    o => o.status === 'PENDING' || o.status === 'COUNTERED',
  );

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
          <MessageSquare className="h-4 w-4" /> Make Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {activeOffer ? 'Your Offer' : 'Make an Offer'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {listingTitle} · Listed at Rs {listingPrice.toLocaleString()}
          </p>
        </DialogHeader>

        {/* ← Existing offers — sirf display, form nahi */}
        {existingOffers.length > 0 && (
          <div className="my-2 max-h-48 space-y-2 overflow-y-auto pr-1">
            {existingOffers.map(offer => (
              <div key={offer.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Rs {offer.amount.toLocaleString()}
                    </span>
                    <Badge variant={statusBadge(offer.status)}>{offer.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(offer.createdAt), 'MMM d')}
                  </span>
                </div>

        
                {offer.status === 'COUNTERED' && offer.counterAmount && (
                  <div className="mt-2 rounded-md border border-border/60 bg-muted p-2">
                    <p className="text-xs font-semibold text-foreground">
                      Counter: Rs {offer.counterAmount.toLocaleString()}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => acceptCounter.mutate(offer.id)}
                        disabled={acceptCounter.isPending}
                        size="sm"
                        className="h-8 text-xs"
                      >
                        Accept Rs {offer.counterAmount.toLocaleString()}
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
                    className="mt-2 h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ← New offer form — amount + message */}
        {!activeOffer && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Your offer (PKR)</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    id="offer-amount"
                    min="1"
                    placeholder={`e.g. ${Math.round(listingPrice * 0.8)}`}
                    type="number"
                    {...field}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* ← Message field */}
            <div className="space-y-2">
              <Label htmlFor="offer-message">Message (optional)</Label>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="offer-message"
                    placeholder="e.g. Would you consider this? I can pay immediately."
                    rows={2}
                    maxLength={500}
                    {...field}
                  />
                )}
              />
            </div>

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!amount || Number(amount) <= 0 || submitOffer.isPending}
              className="w-full"
            >
              {submitOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Offer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}