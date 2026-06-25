import type { AdminListing, ListingStatus } from '@/types/admin/listing';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MessageSquare,
  Package,
  Ruler,
  Tag,
  Weight,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ListingFeedbackSection as FeedbackHistorySection } from '@/components/ListingFeedbackWidgets';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getWeightLabel } from '@/lib/constants';
import {
  getAdminListingsOptions,
  useModerateListing,
} from '@/queries/useAdminListing';

function DetailGallery({ media }: { media: AdminListing['media'] }) {
  const [index, setIndex] = useState(0);
  const images = media
    .filter(m => m.file)
    .map(m => ({ isVideo: m.type === 'VIDEO', url: m.file!.url }));
  if (images.length === 0)
    return <div className="aspect-square rounded-lg bg-muted" />;
  const current = images[index];

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {current.isVideo
          ? (
              <video
                src={current.url}
                controls
                playsInline
                className="h-full w-full bg-black object-contain"
              />
            )
          : (
              <img
                src={current.url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setIndex(p => (p - 1 + images.length) % images.length)}
              className="
                absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm
                hover:bg-background
              "
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIndex(p => (p + 1) % images.length)}
              className="
                absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm
                hover:bg-background
              "
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
              {index + 1}
              /
              {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((img, index_) => (
            <button
              key={img.url}
              onClick={() => setIndex(index_)}
              className={`
                relative h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition
                ${index_ === index
              ? 'border-primary'
              : `
                border-transparent opacity-50
                hover:opacity-100
              `}
              `}
            >
              {img.isVideo
                ? (
                    <>
                      <video
                        src={img.url}
                        muted
                        preload="metadata"
                        className="h-full w-full bg-black object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-semibold text-white">
                        ▶
                      </span>
                    </>
                  )
                : (
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListingModeration() {
  const [filter, setFilter] = useState<'all' | ListingStatus>('PENDING');
  const [reviewListing, setReviewListing] = useState<AdminListing | null>(null);
  const [feedback, setFeedback] = useState('');

  const { data: listings = [], isLoading } = useQuery(
    getAdminListingsOptions(filter),
  );
  const moderateListing = useModerateListing();

  const statusColor = (s: ListingStatus) => {
    if (s === 'APPROVED')
      return 'default' as const;
    if (s === 'REJECTED')
      return 'destructive' as const;
    return 'secondary' as const;
  };

  // Navigate to next pending listing in review modal
  const pendingListings = listings.filter(l => l.status === 'PENDING');
  const currentReviewIndex = reviewListing
    ? pendingListings.findIndex(l => l.id === reviewListing.id)
    : -1;
  const goToNext = () => {
    if (!(currentReviewIndex >= 0
      && currentReviewIndex < pendingListings.length - 1)) {
      return;
    }

    setReviewListing(pendingListings[currentReviewIndex + 1]);
    setFeedback('');
  };

  const handleModerate = (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    feedbackText?: string,
  ) => {
    moderateListing.mutate(
      { listingId: id, feedback: feedbackText, status },
      {
        onError: (error: any) =>
          toast.error(error.message ?? 'Failed to update listing'),
        onSuccess: () => {
          toast.success(`Listing ${status.toLowerCase()}`);
          setReviewListing(null);
          setFeedback('');
        },
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Listing Moderation
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review listings to verify photos match descriptions
          </p>
        </div>
        <Select
          onValueChange={v => setFilter(v as 'all' | ListingStatus)}
          value={filter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading
        ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )
        : (listings.length === 0
            ? (
                <div className="mt-8 text-center text-muted-foreground">
                  No listings found
                </div>
              )
            : (
                <div className="mt-6 space-y-3">
                  {listings.map(listing => (
                    <Card key={listing.id} className="group">
                      <CardContent className="
                        flex flex-col gap-4 p-4
                        sm:flex-row sm:items-center
                      "
                      >
                        <img
                          src={listing.coverImage?.url || '/placeholder.svg'}
                          alt={listing.title}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold text-foreground">
                              {listing.title}
                            </h3>
                            <Badge variant={statusColor(listing.status)}>
                              {listing.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {listing.brand}
                            {' '}
                            ·
                            {listing.categoryLabel}
                            {' '}
                            · Rs
                            {' '}
                            {listing.price.toLocaleString()}
                            {listing.media?.length > 1
                              && ` · ${listing.media.length} files`}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {listing.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            onClick={() => {
                              setReviewListing(listing);
                              setFeedback('');
                            }}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {' '}
                            Review
                          </Button>
                          {listing.status !== 'APPROVED' && (
                            <Button
                              onClick={() => handleModerate(listing.id, 'APPROVED')}
                              disabled={moderateListing.isPending}
                              size="sm"
                              variant="outline"
                              className="gap-1 text-primary"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {' '}
                              Approve
                            </Button>
                          )}
                          {listing.status !== 'REJECTED' && (
                            <Button
                              onClick={() => handleModerate(listing.id, 'REJECTED')}
                              disabled={moderateListing.isPending}
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              {' '}
                              Reject
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}

      {/* Full review modal */}
      <Dialog
        onOpenChange={open => !open && setReviewListing(null)}
        open={!!reviewListing}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {reviewListing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="font-heading text-xl">
                    {reviewListing.title}
                  </DialogTitle>
                  <Badge variant={statusColor(reviewListing.status)}>
                    {reviewListing.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="
                mt-4 grid gap-6
                md:grid-cols-2
              "
              >
                {/* Images */}
                <DetailGallery media={reviewListing.media || []} />

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {reviewListing.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">
                          Brand
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {reviewListing.brand}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">
                          Category
                        </p>
                        <p className="text-sm font-semibold capitalize text-foreground">
                          {reviewListing.categoryLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">
                          Size
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {reviewListing.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">
                          Condition
                        </p>
                        <p className="text-sm font-semibold capitalize text-foreground">
                          {reviewListing.condition.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">
                        Price
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        Rs
                        {' '}
                        {reviewListing.price.toLocaleString()}
                      </p>
                    </div>
                    {reviewListing.weight && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Weight className="h-4 w-4" />
                        <span className="text-sm">
                          {getWeightLabel(reviewListing.weight)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Submitted
                    {' '}
                    {format(
                      new Date(reviewListing.createdAt),
                      'MMM d, yyyy \'at\' h:mm a',
                    )}
                    <br />
                    Seller ID:
                    {' '}
                    {reviewListing.sellerId.slice(0, 8)}
                    …
                  </div>

                  {/* Previous feedback history */}
                  {reviewListing && (
                    <FeedbackHistorySection listingId={reviewListing.id} />
                  )}

                  {/* New Feedback */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        New Feedback
                      </p>
                    </div>
                    <Textarea
                      onChange={event => setFeedback(event.target.value)}
                      value={feedback}
                      placeholder="Provide feedback to the seller (optional for approval, recommended for rejection)..."
                      rows={3}
                    />
                  </div>

                  {/* Moderation actions */}
                  <div className="flex gap-3">
                    {reviewListing.status !== 'APPROVED' && (
                      <Button
                        onClick={() => {
                          handleModerate(
                            reviewListing.id,
                            'APPROVED',
                            feedback || undefined,
                          );
                          goToNext();
                        }}
                        disabled={moderateListing.isPending}
                        className="flex-1 gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {' '}
                        Approve
                      </Button>
                    )}
                    {reviewListing.status !== 'REJECTED' && (
                      <Button
                        onClick={() => {
                          handleModerate(
                            reviewListing.id,
                            'REJECTED',
                            feedback,
                          );
                          goToNext();
                        }}
                        disabled={moderateListing.isPending}
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        {' '}
                        Reject
                      </Button>
                    )}
                  </div>

                  {currentReviewIndex >= 0 && pendingListings.length > 1 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Reviewing
                      {' '}
                      {currentReviewIndex + 1}
                      {' '}
                      of
                      {' '}
                      {pendingListings.length}
                      {' '}
                      pending
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ListingModeration;
