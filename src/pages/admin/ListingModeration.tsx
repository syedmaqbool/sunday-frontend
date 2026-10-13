import type { AdminListing, ListingStatus, ModerateListingPayload } from '@/types/adminListing.type';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AdminListingFeedbackSection as FeedbackHistorySection } from '@/components/AdminListingFeedbackWidgets';
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
import { showErrorToast } from '@/lib/errorToast';
import { formatEnumLabel } from '@/lib/utilities';
import {
  getAdminListingsOptions,
  useModerateListingMutation,
} from '@/queries/adminListing.query';

const listingFeedbackSchema = z.object({ feedback: z.string() });
const LISTING_FILTERS = ['all', 'APPROVED', 'NEEDS_REVISION', 'PENDING', 'REJECTED', 'RESERVED', 'SOLD'] as const;
const REVIEW_LOOKUP_PAGE_SIZE = 100;

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
              <div className="relative h-full w-full bg-black">
                <video
                  src={current.url}
                  onClick={(event) => {
                    const video = event.currentTarget;

                    if (video.paused) {
                      void video.play();
                    }
                    else {
                      video.pause();
                    }
                  }}
                  onVolumeChange={(event) => {
                    const video = event.currentTarget;

                    if (!video.muted || video.volume !== 0) {
                      video.muted = true;
                      video.volume = 0;
                    }
                  }}
                  controls={false}
                  muted
                  playsInline
                  className="h-full w-full bg-black object-contain"
                />

                <button
                  onClick={(event) => {
                    const video = event.currentTarget.parentElement?.querySelector('video');

                    if (!video) {
                      return;
                    }

                    if (video.paused) {
                      void video.play();
                    }
                    else {
                      video.pause();
                    }
                  }}
                  type="button"
                  className="absolute bottom-3 left-3 rounded-md bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm"
                >
                  Play / Pause
                </button>

                <span className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur-sm">
                  Muted
                </span>
              </div>
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
  const [searchParameters, setSearchParameters] = useSearchParams();
  const requestedFilter = searchParameters.get('status');
  const filter: 'all' | ListingStatus = requestedFilter
    && LISTING_FILTERS.includes(requestedFilter as (typeof LISTING_FILTERS)[number])
    ? requestedFilter as 'all' | ListingStatus
    : 'PENDING';
  const requestedListingId = searchParameters.get('listing');
  const feedbackForm = useForm<z.infer<typeof listingFeedbackSchema>>({
    defaultValues: { feedback: '' },
    resolver: zodResolver(listingFeedbackSchema),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const apiStatus = filter === 'all' ? undefined : filter;
  const {
    data: listingsResponse,
    isLoading,
    isPlaceholderData,
  } = useQuery({
    ...getAdminListingsOptions({
      page: currentPage,
      size: itemsPerPage,
      status: apiStatus,
    }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === apiStatus ? previousData : undefined,
  });
  const listings = listingsResponse?.data ?? [];
  const totalListings = listingsResponse?.pagination.total ?? 0;
  const totalPages = Math.max(1, listingsResponse?.pagination.lastPage ?? 1);
  const startRecord = totalListings === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, totalListings);
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  const selectedPageListing = requestedListingId
    ? listings.find(listing => listing.id === requestedListingId)
    : undefined;
  const reviewListingsQuery = useQuery({
    ...getAdminListingsOptions({
      page: 1,
      size: REVIEW_LOOKUP_PAGE_SIZE,
      status: apiStatus,
    }),
    enabled: Boolean(requestedListingId) && selectedPageListing === undefined,
  });
  const firstPageReviewListings = reviewListingsQuery.data?.data ?? [];
  const reviewListingFromFirstPage = firstPageReviewListings.find(
    listing => listing.id === requestedListingId,
  );
  const reviewListing = requestedListingId
    ? selectedPageListing ?? reviewListingFromFirstPage ?? null
    : null;
  const moderateListing = useModerateListingMutation();

  const statusColor = (s: ListingStatus) => {
    if (s === 'APPROVED')
      return 'default' as const;
    if (s === 'REJECTED')
      return 'destructive' as const;
    return 'secondary' as const;
  };

  // Navigate to next pending listing in review modal
  const firstPageReviewListingIds = new Set(firstPageReviewListings.map(listing => listing.id));
  const pendingListings = [
    ...firstPageReviewListings,
    ...listings.filter(listing => !firstPageReviewListingIds.has(listing.id)),
  ].filter(listing => listing.status === 'PENDING');
  const currentReviewIndex = reviewListing
    ? pendingListings.findIndex(l => l.id === reviewListing.id)
    : -1;
  const updateReviewSelection = (listingId: string | null, nextFilter = filter) => {
    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.set('status', nextFilter);
    if (listingId)
      nextParameters.set('listing', listingId);
    else
      nextParameters.delete('listing');
    setSearchParameters(nextParameters);
  };
  const goToNext = () => {
    if (!(currentReviewIndex >= 0
      && currentReviewIndex < pendingListings.length - 1)) {
      return;
    }

    updateReviewSelection(pendingListings[currentReviewIndex + 1].id);
    feedbackForm.reset({ feedback: '' });
  };

  useEffect(() => {
    if (isLoading || reviewListingsQuery.isLoading || !requestedListingId || reviewListing)
      return;

    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.delete('listing');
    setSearchParameters(nextParameters, { replace: true });
  }, [isLoading, requestedListingId, reviewListing, reviewListingsQuery.isLoading, searchParameters, setSearchParameters]);
  const handleModerate = async (
    id: string,
    status: ModerateListingPayload['status'],
    feedbackText?: string,
  ) => {
    const normalizedFeedback = feedbackText?.trim();

    if (status === 'NEEDS_REVISION' && !normalizedFeedback) {
      feedbackForm.setError('feedback', {
        message: 'Enter feedback before requesting revisions.',
        type: 'required',
      });
      return;
    }

    feedbackForm.clearErrors('feedback');

    try {
      await moderateListing.mutateAsync({
        listingId: id,
        status,
        ...(normalizedFeedback && { feedback: normalizedFeedback }),
      });
      toast.success(status === 'NEEDS_REVISION'
        ? 'Listing marked as needing revision'
        : `Listing ${status.toLowerCase()}`);
      updateReviewSelection(null);
      feedbackForm.reset({ feedback: '' });
      goToNext();
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to update listing');
    }
  };

  const submitReviewDecision = (id: string, status: ModerateListingPayload['status']) =>
    feedbackForm.handleSubmit(values => handleModerate(id, status, values.feedback))();

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
          onValueChange={(v) => {
            setCurrentPage(1);
            updateReviewSelection(null, v as 'all' | ListingStatus);
          }}
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
                <>
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
                                {formatEnumLabel(listing.status)}
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
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              onClick={() => {
                                updateReviewSelection(listing.id);
                                feedbackForm.reset({ feedback: '' });
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
                  {listings.length > 0 && (
                    <div className="
                      mt-4 flex flex-col gap-3
                      sm:flex-row sm:items-center sm:justify-between
                    "
                    >
                      <div className="text-sm text-muted-foreground">
                        {isPlaceholderData
                          ? (
                              <span role="status">
                                Loading page
                                {' '}
                                {currentPage}
                                …
                              </span>
                            )
                          : (
                              <>
                                Showing
                                {' '}
                                {startRecord}
                                –
                                {endRecord}
                                {' '}
                                of
                                {' '}
                                {totalListings}
                                {' '}
                                listings
                              </>
                            )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page</span>
                        <Select
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                          value={String(itemsPerPage)}
                        >
                          <SelectTrigger disabled={isPlaceholderData} className="w-[90px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                          disabled={isPlaceholderData || currentPage === 1}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </Button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            aria-current={page === currentPage ? 'page' : undefined}
                            disabled={isPlaceholderData}
                            size="sm"
                            type="button"
                            variant={page === currentPage ? 'default' : 'outline'}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                          disabled={isPlaceholderData || currentPage === totalPages}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ))}

      {/* Full review modal */}
      <Dialog
        onOpenChange={(open) => {
          if (open) {
            return;
          }

          updateReviewSelection(null);
          feedbackForm.reset({ feedback: '' });
        }}
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
                    {formatEnumLabel(reviewListing.status)}
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
                        <p className="text-sm font-semibold text-foreground">
                          {formatEnumLabel(reviewListing.condition)}
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
                    <Link
                      to={`/seller/${reviewListing.sellerId}`}
                      className="
                        font-medium underline-offset-4
                        hover:underline
                        focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      "
                    >
                      {reviewListing.sellerName}
                    </Link>
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
                    <Controller
                      name="feedback"
                      control={feedbackForm.control}
                      render={({ field, fieldState }) => (
                        <Textarea
                          {...field}
                          onChange={(event) => {
                            field.onChange(event);
                            if (event.target.value.trim()) {
                              feedbackForm.clearErrors('feedback');
                            }
                          }}
                          aria-describedby={fieldState.error ? 'listing-feedback-hint listing-feedback-error' : 'listing-feedback-hint'}
                          aria-invalid={fieldState.invalid}
                          placeholder="Feedback for the seller"
                          rows={3}
                        />
                      )}
                    />
                    <p id="listing-feedback-hint" className="text-xs text-muted-foreground">
                      Required when requesting revisions. Optional for approval or rejection.
                    </p>
                    {feedbackForm.formState.errors.feedback && (
                      <p id="listing-feedback-error" role="alert" className="text-sm text-destructive">
                        {feedbackForm.formState.errors.feedback.message}
                      </p>
                    )}
                  </div>

                  {/* Moderation actions */}
                  <div className="flex gap-3">
                    {reviewListing.status !== 'APPROVED' && (
                      <Button
                        onClick={() => submitReviewDecision(reviewListing.id, 'APPROVED')}
                        disabled={moderateListing.isPending}
                        type="button"
                        className="flex-1 gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {' '}
                        Approve
                      </Button>
                    )}
                    {reviewListing.status !== 'NEEDS_REVISION' && (
                      <Button
                        onClick={() => submitReviewDecision(reviewListing.id, 'NEEDS_REVISION')}
                        disabled={moderateListing.isPending}
                        type="button"
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {' '}
                        Request revisions
                      </Button>
                    )}
                    {reviewListing.status !== 'REJECTED' && (
                      <Button
                        onClick={() => submitReviewDecision(reviewListing.id, 'REJECTED')}
                        disabled={moderateListing.isPending}
                        type="button"
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
