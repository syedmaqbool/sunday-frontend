import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Loader2,
  Package,
  Pencil,
  Plus,
  Rocket,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BoostDialog from '@/components/BoostDialog';
import Footer from '@/components/Footer';
import { ListingFeedbackInline } from '@/components/ListingFeedbackWidgets';
import Navbar from '@/components/Navbar';
import { ReceivedOffers } from '@/components/ReceivedOffers';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getWeightLabel } from '@/lib/constants';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { getMyListingsOptions } from '@/queries/useMyListings';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LISTINGS = [
  {
    id: 'mock-listing-1',
    brand: 'Zara',
    created_at: '2026-06-10T10:00:00.000Z',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'],
    price: 6500,
    reserved_until: null,
    status: 'approved',
    title: 'Vintage Leather Jacket',
    weight: 'medium',
  },
  {
    id: 'mock-listing-2',
    brand: 'Nike',
    created_at: '2026-06-08T14:30:00.000Z',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'],
    price: 3500,
    reserved_until: '2026-06-20T18:00:00.000Z',
    status: 'reserved',
    title: 'Classic White Sneakers',
    weight: 'light',
  },
  {
    id: 'mock-listing-3',
    brand: 'Mango',
    created_at: '2026-06-15T09:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
    ],
    price: 2800,
    reserved_until: null,
    status: 'pending',
    title: 'Bohemian Summer Dress',
    weight: 'light',
  },
  {
    id: 'mock-listing-4',
    brand: 'H&M',
    created_at: '2026-06-05T11:15:00.000Z',
    images: ['https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600'],
    price: 2200,
    reserved_until: null,
    status: 'rejected',
    title: 'Kids Denim Dungarees',
    weight: 'light',
  },
  {
    id: 'mock-listing-5',
    brand: 'Uniqlo',
    created_at: '2026-05-28T16:45:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600',
    ],
    price: 8900,
    reserved_until: null,
    status: 'sold',
    title: 'Wool Winter Coat',
    weight: 'heavy',
  },
];

function getStatusColor(status: string) {
  if (status === 'approved' || status === 'reserved')
    return 'default';
  if (status === 'rejected')
    return 'destructive';
  return 'secondary';
}

function isReadOnlyStatus(status: string) {
  return ['approved', 'reserved', 'sold'].includes(status);
}

// ─── Component ────────────────────────────────────────────────────────────────

function MyListings() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery(
    getMyListingsOptions(user?.id),
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMockDataEnabled)
        return;
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error)
        throw error;
    },
    onError: () => toast.error('Failed to delete listing'),
    onSuccess: (_data, id) => {
      toast.success('Listing deleted');
      if (isMockDataEnabled) {
        queryClient.setQueryData(['my-listings', user?.id], (old: any[] = []) =>
          old.filter(l => l.id !== id));
      }
      else {
        queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      }
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMockDataEnabled)
        return;
      const { error } = await supabase
        .from('listings')
        .update({ status: 'pending' } as any)
        .eq('id', id);
      if (error)
        throw error;
    },
    onError: () => toast.error('Failed to resubmit'),
    onSuccess: (_data, id) => {
      toast.success('Listing resubmitted for review');
      if (isMockDataEnabled) {
        queryClient.setQueryData(['my-listings', user?.id], (old: any[] = []) =>
          old.map(l => (l.id === id ? { ...l, status: 'pending' } : l)));
      }
      else {
        queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      }
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMockDataEnabled)
        return;
      const { error } = await supabase.rpc('expire_listing_reservation', {
        _force: true,
        _listing_id: id,
      });
      if (error)
        throw error;
    },
    onError: (error: any) => toast.error(error.message ?? 'Failed'),
    onSuccess: (_data, id) => {
      toast.success('Reservation cancelled');
      if (isMockDataEnabled) {
        queryClient.setQueryData(['my-listings', user?.id], (old: any[] = []) =>
          old.map(l =>
            l.id === id
              ? { ...l, reserved_until: null, status: 'approved' }
              : l,
          ));
      }
      else {
        queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      }
    },
  });

  useEffect(() => {
    if (!authLoading && !user && !isMockDataEnabled)
      navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading)
    return null;
  if (!user && !isMockDataEnabled)
    return null;

  const approvedListings = listings.filter(
    (l: any) => l.status === 'approved' || l.status === 'reserved',
  );
  const soldListings = listings.filter((l: any) => l.status === 'sold');
  const pendingListings = listings.filter(
    (l: any) => !['approved', 'reserved', 'sold'].includes(l.status),
  );

  const renderListingCard = (listing: any) => (
    <Card key={listing.id}>
      <CardContent className="
        flex flex-col gap-4 p-4
        sm:flex-row sm:items-center
      "
      >
        <img
          src={listing.images?.[0] || '/placeholder.svg'}
          alt={listing.title}
          className={`
            h-20 w-20 rounded-md object-cover
            ${listing.status === 'reserved' ? 'opacity-60 grayscale' : ''}
          `}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {listing.title}
            </h3>
            <Badge variant={getStatusColor(listing.status)}>
              {listing.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {listing.brand}
            {' '}
            · R
            {listing.price.toLocaleString()}
            {listing.weight ? ` · ${getWeightLabel(listing.weight)}` : ''}
          </p>
          {listing.status === 'reserved' && listing.reserved_until && (
            <p className="mt-1 text-xs text-primary">
              Reserved · expires
              {' '}
              {new Date(listing.reserved_until).toLocaleString()}
            </p>
          )}
          <ListingFeedbackInline listingId={listing.id} />
        </div>
        <div className="flex shrink-0 gap-2">
          {['approved', 'sold', 'reserved'].includes(listing.status) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Inbox className="h-3.5 w-3.5" />
                  {' '}
                  Offers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    Offers ·
                    {' '}
                    {listing.title}
                  </DialogTitle>
                </DialogHeader>
                <ReceivedOffers listingId={listing.id} />
              </DialogContent>
            </Dialog>
          )}
          {listing.status === 'reserved' && (
            <Button
              onClick={() => cancelReservationMutation.mutate(listing.id)}
              disabled={cancelReservationMutation.isPending}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              Cancel reservation
            </Button>
          )}
          {listing.status === 'approved' && (
            <BoostDialog
              listingId={listing.id}
              listingTitle={listing.title}
              trigger={(
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-primary"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  {' '}
                  Boost
                </Button>
              )}
            />
          )}
          {!isReadOnlyStatus(listing.status) && (
            <Button
              onClick={() => navigate(`/edit-listing/${listing.id}`)}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Pencil className="h-3.5 w-3.5" />
              {' '}
              Edit
            </Button>
          )}
          {listing.status === 'rejected' && (
            <Button
              onClick={() => resubmitMutation.mutate(listing.id)}
              disabled={resubmitMutation.isPending}
              size="sm"
              variant="outline"
              className="gap-1 text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {' '}
              Resubmit
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {' '}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "
                  {listing.title}
                  " and cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(listing.id)}
                  className="
                    bg-destructive text-destructive-foreground
                    hover:bg-destructive/90
                  "
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-3xl flex-1 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              My Listings
            </h1>
            <p className="mt-1 text-muted-foreground">
              {listings.length}
              {' '}
              items listed
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/boost')}
              variant="outline"
              className="gap-1"
            >
              <Rocket className="h-4 w-4" />
              {' '}
              Boost
            </Button>
            <Button
              onClick={() => navigate('/create-listing')}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              {' '}
              New Listing
            </Button>
          </div>
        </div>

        {isLoading
          ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : (listings.length === 0
              ? (
                  <div className="mt-12 flex flex-col items-center text-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-heading text-xl font-semibold text-foreground">
                      No listings yet
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Start selling by creating your first listing
                    </p>
                    <Button
                      onClick={() => navigate('/create-listing')}
                      className="mt-4 gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      {' '}
                      Create Listing
                    </Button>
                  </div>
                )
              : (
                  <Tabs defaultValue="approved" className="mt-6">
                    <TabsList>
                      <TabsTrigger value="approved">
                        Approved (
                        {approvedListings.length}
                        )
                      </TabsTrigger>
                      <TabsTrigger value="pending">
                        Pending (
                        {pendingListings.length}
                        )
                      </TabsTrigger>
                      <TabsTrigger value="sold">
                        Sold (
                        {soldListings.length}
                        )
                      </TabsTrigger>
                      <TabsTrigger value="offers" className="gap-1.5">
                        <Inbox className="h-4 w-4" />
                        {' '}
                        Offers Received
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="approved" className="mt-4">
                      {approvedListings.length === 0
                        ? (
                            <div className="flex flex-col items-center py-12 text-center">
                              <Package className="h-10 w-10 text-muted-foreground" />
                              <p className="mt-3 font-heading text-base font-semibold text-foreground">
                                No approved listings yet
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Approved listings will appear here once reviewed.
                              </p>
                            </div>
                          )
                        : (
                            <div className="space-y-3">
                              {approvedListings.map(listing => renderListingCard(listing))}
                            </div>
                          )}
                    </TabsContent>

                    <TabsContent value="pending" className="mt-4">
                      {pendingListings.length === 0
                        ? (
                            <div className="flex flex-col items-center py-12 text-center">
                              <Package className="h-10 w-10 text-muted-foreground" />
                              <p className="mt-3 font-heading text-base font-semibold text-foreground">
                                Nothing pending review
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Listings awaiting review or needing changes will show up
                                here.
                              </p>
                            </div>
                          )
                        : (
                            <div className="space-y-3">
                              {pendingListings.map(listing => renderListingCard(listing))}
                            </div>
                          )}
                    </TabsContent>

                    <TabsContent value="sold" className="mt-4">
                      {soldListings.length === 0
                        ? (
                            <div className="flex flex-col items-center py-12 text-center">
                              <Package className="h-10 w-10 text-muted-foreground" />
                              <p className="mt-3 font-heading text-base font-semibold text-foreground">
                                No sold listings yet
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Sold items will appear here. They can no longer be edited.
                              </p>
                            </div>
                          )
                        : (
                            <div className="space-y-3">
                              {soldListings.map(listing => renderListingCard(listing))}
                            </div>
                          )}
                    </TabsContent>

                    <TabsContent value="offers" className="mt-4">
                      <ReceivedOffers />
                    </TabsContent>
                  </Tabs>
                ))}
      </main>
      <Footer />
    </div>
  );
}

export default MyListings;
