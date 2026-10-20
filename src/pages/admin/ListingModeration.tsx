import type { AdminListing, ListingStatus, ModerateListingPayload } from '@/types/adminListing.type';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MessageSquare,
  Package,
  Pencil,
  Ruler,
  Tag,
  Weight,
  X,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAccessControl } from '@/hooks/useAccessControl';
import { getWeightLabel } from '@/lib/constants';
import { showErrorToast } from '@/lib/errorToast';
import { formatEnumLabel } from '@/lib/utilities';
import {
  getAdminListingsOptions,
  useModerateListingMutation,
  useRemoveAdminListingMutation,
  useReorderAdminListingMediaMutation,
  useRestoreAdminListingMutation,
  useUpdateAdminListingTitleMutation,
} from '@/queries/adminListing.query';

const listingFeedbackSchema = z.object({ feedback: z.string() });
const LISTING_FILTERS = ['all', 'APPROVED', 'NEEDS_REVISION', 'PENDING', 'REJECTED', 'RESERVED', 'SOLD', 'DELETED'] as const;
const REVIEW_LOOKUP_PAGE_SIZE = 100;
const removalReasonSchema = z.object({ reason: z.string().trim().min(1, 'Enter a reason before removing this listing.') });
const listingTitleSchema = z.object({ title: z.string().trim().min(1).max(120) });

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

function MediaReorderPanel({
  isSaving,
  media,
  onCancel,
  onSave,
}: {
  isSaving: boolean;
  media: AdminListing['media'];
  onCancel: () => void;
  onSave: (mediaIds: string[]) => void;
}) {
  const [mediaIds, setMediaIds] = useState(() => [...media]
    .toSorted((firstMedia, secondMedia) => firstMedia.sortOrder - secondMedia.sortOrder)
    .map(mediaItem => mediaItem.id));
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const orderedMedia = mediaIds.flatMap((mediaId) => {
    const mediaItem = media.find(item => item.id === mediaId);
    return mediaItem ? [mediaItem] : [];
  });
  const coverMediaId = orderedMedia.find(mediaItem => mediaItem.type === 'IMAGE')?.id;

  const moveMedia = (mediaId: string, targetIndex: number) => {
    setMediaIds((currentIds) => {
      const sourceIndex = currentIds.indexOf(mediaId);
      if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= currentIds.length) {
        return currentIds;
      }

      const nextIds = [...currentIds];
      nextIds.splice(sourceIndex, 1);
      nextIds.splice(targetIndex, 0, mediaId);
      return nextIds;
    });
  };

  const moveMediaBy = (mediaId: string, direction: -1 | 1) => {
    const index = mediaIds.indexOf(mediaId);
    moveMedia(mediaId, index + direction);
  };

  const dropMedia = (sourceMediaId: string, targetMediaId: string) => {
    if (sourceMediaId === targetMediaId) {
      return;
    }

    const targetIndex = mediaIds.indexOf(targetMediaId);
    moveMedia(sourceMediaId, targetIndex);
    setDraggedMediaId(null);
  };

  return (
    <section aria-label="Reorder listing media" className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">Drag thumbnails or use the arrows. The first image is the cover.</p>
      <div role="list" aria-label="Listing media order" className="grid grid-cols-4 gap-2">
        {orderedMedia.map((mediaItem, index) => {
          const filename = mediaItem.file?.filename ?? `${mediaItem.type.toLowerCase()} ${index + 1}`;
          const isCover = mediaItem.id === coverMediaId;

          return (
            <div
              key={mediaItem.id}
              role="listitem"
              aria-label={`${mediaItem.type === 'VIDEO' ? 'Video' : 'Image'} ${filename}`}
              className={`relative aspect-square cursor-move overflow-hidden rounded border-2 ${draggedMediaId === mediaItem.id ? 'border-primary opacity-50' : 'border-border'}`}
              draggable={!isSaving}
              onDragEnd={() => setDraggedMediaId(null)}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', mediaItem.id);
                setDraggedMediaId(mediaItem.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceMediaId = event.dataTransfer.getData('text/plain') || draggedMediaId;
                if (sourceMediaId) {
                  dropMedia(sourceMediaId, mediaItem.id);
                }
              }}
            >
              <div className="h-full w-full bg-muted">
                {mediaItem.file?.url && mediaItem.type === 'VIDEO'
                  ? <video aria-label={filename} src={mediaItem.file.url} muted preload="metadata" className="h-full w-full object-cover" />
                  : mediaItem.file?.url
                    ? <img src={mediaItem.file.url} alt="" className="h-full w-full object-cover" />
                    : <span className="flex h-full items-center justify-center text-xs">{mediaItem.type}</span>}
              </div>
              {isCover && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-0.5">
                <button
                  aria-label={`Move ${filename} left`}
                  disabled={isSaving || index === 0}
                  onClick={() => moveMediaBy(mediaItem.id, -1)}
                  type="button"
                  className="rounded bg-background/80 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  aria-label={`Move ${filename} right`}
                  disabled={isSaving || index === orderedMedia.length - 1}
                  onClick={() => moveMediaBy(mediaItem.id, 1)}
                  type="button"
                  className="rounded bg-background/80 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button disabled={isSaving} onClick={() => onSave(mediaIds)} type="button">
          {isSaving ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save order
        </Button>
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="outline">Cancel</Button>
      </div>
    </section>
  );
}

function ListingModeration() {
  const [searchParameters, setSearchParameters] = useSearchParams();
  const requestedFilter = searchParameters.get('status');
  const filter: 'all' | 'DELETED' | ListingStatus = requestedFilter
    && LISTING_FILTERS.includes(requestedFilter as (typeof LISTING_FILTERS)[number])
    ? requestedFilter as 'all' | 'DELETED' | ListingStatus
    : 'PENDING';
  const requestedListingId = searchParameters.get('listing');
  const feedbackForm = useForm<z.infer<typeof listingFeedbackSchema>>({
    defaultValues: { feedback: '' },
    resolver: zodResolver(listingFeedbackSchema),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRemovalReasonDialogOpen, setIsRemovalReasonDialogOpen] = useState(false);
  const [isRemovalConfirmationOpen, setIsRemovalConfirmationOpen] = useState(false);
  const [listingToRemove, setListingToRemove] = useState<AdminListing | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState<{ listingId: string; title: string } | null>(null);
  const [isReorderingMedia, setIsReorderingMedia] = useState(false);
  const accessControl = useAccessControl();
  const canRemoveListings = accessControl.hasPermissions(['LISTINGS_READ', 'LISTINGS_DELETE']);
  const removalReasonForm = useForm<z.infer<typeof removalReasonSchema>>({
    defaultValues: { reason: '' },
    resolver: zodResolver(removalReasonSchema),
  });
  const titleForm = useForm<z.infer<typeof listingTitleSchema>>({
    defaultValues: { title: '' },
    mode: 'onChange',
    resolver: zodResolver(listingTitleSchema),
  });
  const titleDraft = titleForm.watch('title');
  const apiStatus = filter === 'all' || filter === 'DELETED' ? undefined : filter;
  const isDeleted = filter === 'DELETED' ? true : undefined;
  const {
    data: listingsResponse,
    isLoading,
    isPlaceholderData,
  } = useQuery({
    ...getAdminListingsOptions({
      isDeleted,
      page: currentPage,
      size: itemsPerPage,
      status: apiStatus,
    }),
    placeholderData: (previousData, previousQuery) => {
      const hasMatchingFilters = previousQuery?.queryKey[2] === apiStatus
        && previousQuery?.queryKey[3] === isDeleted;
      return hasMatchingFilters ? previousData : undefined;
    },
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
      isDeleted,
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
  const reorderMedia = useReorderAdminListingMediaMutation();
  const removeListing = useRemoveAdminListingMutation();
  const restoreListing = useRestoreAdminListingMutation();
  const updateListingTitle = useUpdateAdminListingTitleMutation();

  const beginTitleEdit = (listing: AdminListing) => {
    titleForm.reset({ title: listing.title });
    setIsEditingTitle(true);
  };

  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
    titleForm.reset({ title: '' });
  };

  const saveTitleEdit = async ({ title }: z.infer<typeof listingTitleSchema>) => {
    if (!reviewListing || updateListingTitle.isPending) {
      return;
    }

    try {
      const response = await updateListingTitle.mutateAsync({
        listingId: reviewListing.id,
        title,
      });
      setUpdatedTitle({ listingId: reviewListing.id, title: response.data.title });
      cancelTitleEdit();
      toast.success('Listing title updated');
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to update listing title');
    }
  };

  const beginListingRemoval = (listing: AdminListing) => {
    setListingToRemove(listing);
    removalReasonForm.reset({ reason: '' });
    setIsRemovalReasonDialogOpen(true);
  };

  const confirmListingRemoval = removalReasonForm.handleSubmit(() => {
    setIsRemovalReasonDialogOpen(false);
    setIsRemovalConfirmationOpen(true);
  });

  const submitListingRemoval = async () => {
    if (!listingToRemove) {
      return;
    }

    try {
      await removeListing.mutateAsync({
        listingId: listingToRemove.id,
        reason: removalReasonForm.getValues('reason').trim(),
      });
      toast.success('Listing removed');
      setIsRemovalConfirmationOpen(false);
      setListingToRemove(null);
      removalReasonForm.reset({ reason: '' });
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to remove listing');
    }
  };

  const submitListingRestore = async (listing: AdminListing) => {
    try {
      await restoreListing.mutateAsync({ listingId: listing.id });
      toast.success('Listing restored');
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to restore listing');
    }
  };

  const submitMediaOrder = async (listing: AdminListing, mediaIds: string[]) => {
    try {
      await reorderMedia.mutateAsync({ listingId: listing.id, mediaIds });
      toast.success('Media order updated');
      setIsReorderingMedia(false);
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to update media order');
    }
  };

  useEffect(() => {
    setIsReorderingMedia(false);
  }, [reviewListing?.id]);

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
  const updateReviewSelection = (listingId: string | null, nextFilter: 'all' | 'DELETED' | ListingStatus = filter) => {
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
            updateReviewSelection(null, v as 'all' | 'DELETED' | ListingStatus);
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
            <SelectItem value="DELETED">Deleted</SelectItem>
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
                              {listing.deletedAt && <Badge variant="destructive">Deleted</Badge>}
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
          if (open || reorderMedia.isPending || updateListingTitle.isPending) {
            return;
          }

          if (isEditingTitle) {
            cancelTitleEdit();
            return;
          }

          setIsReorderingMedia(false);
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
                  {isEditingTitle
                    ? (
                        <form className="flex flex-1 items-center gap-2" onSubmit={titleForm.handleSubmit(saveTitleEdit)}>
                          <Input
                            aria-label="Listing title"
                            autoFocus
                            maxLength={120}
                            {...titleForm.register('title')}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                event.stopPropagation();
                                cancelTitleEdit();
                              }
                              else if (event.key === 'Enter') {
                                event.preventDefault();
                                void titleForm.handleSubmit(saveTitleEdit)();
                              }
                            }}
                          />
                          <Button
                            aria-label="Save title"
                            disabled={!titleDraft.trim() || titleDraft.length > 120 || updateListingTitle.isPending}
                            size="icon"
                            type="submit"
                          >
                            {updateListingTitle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button aria-label="Cancel title edit" onClick={cancelTitleEdit} size="icon" type="button" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </form>
                      )
                    : (
                        <div className="flex items-center gap-2">
                          <DialogTitle className="font-heading text-xl">
                            {(updatedTitle?.listingId === reviewListing.id && updatedTitle.title) || reviewListing.title}
                          </DialogTitle>
                          {accessControl.hasPermission('LISTINGS_UPDATE') && (
                            <Button
                              aria-label="Edit title"
                              onClick={() => beginTitleEdit(reviewListing)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                  <Badge variant={statusColor(reviewListing.status)}>
                    {formatEnumLabel(reviewListing.status)}
                  </Badge>
                  {reviewListing.deletedAt && <Badge variant="destructive">Deleted</Badge>}
                </div>
              </DialogHeader>

              <div className="
                mt-4 grid gap-6
                md:grid-cols-2
              "
              >
                {/* Images */}
                <div className="space-y-3">
                  {isReorderingMedia
                    ? (
                        <MediaReorderPanel
                          isSaving={reorderMedia.isPending}
                          media={reviewListing.media || []}
                          onCancel={() => setIsReorderingMedia(false)}
                          onSave={mediaIds => submitMediaOrder(reviewListing, mediaIds)}
                        />
                      )
                    : (
                        <>
                          <DetailGallery media={reviewListing.media || []} />
                          {reviewListing.media.length > 1 && (
                            <Button
                              onClick={() => setIsReorderingMedia(true)}
                              type="button"
                              variant="outline"
                            >
                              Reorder media
                            </Button>
                          )}
                        </>
                      )}
                </div>

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

                  {reviewListing.deletedAt && reviewListing.deletionReason && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">
                        Removal reason
                      </h3>
                      <p className="mt-1 text-sm text-foreground">{reviewListing.deletionReason}</p>
                    </div>
                  )}

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

                  {canRemoveListings && reviewListing.deletedAt && (
                    <Button
                      onClick={() => submitListingRestore(reviewListing)}
                      disabled={restoreListing.isPending}
                      type="button"
                      variant="outline"
                      className="w-full"
                    >
                      Restore
                    </Button>
                  )}
                  {canRemoveListings && !reviewListing.deletedAt && !['RESERVED', 'SOLD'].includes(reviewListing.status) && (
                    <Button
                      onClick={() => beginListingRemoval(reviewListing)}
                      disabled={removeListing.isPending}
                      type="button"
                      variant="destructive"
                      className="w-full"
                    >
                      Delete listing
                    </Button>
                  )}

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

      <Dialog
        onOpenChange={(open) => {
          setIsRemovalReasonDialogOpen(open);
          if (!open && !isRemovalConfirmationOpen) {
            setListingToRemove(null);
            removalReasonForm.reset({ reason: '' });
          }
        }}
        open={isRemovalReasonDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for removing listing</DialogTitle>
          </DialogHeader>
          <form onSubmit={confirmListingRemoval} className="space-y-4">
            <Textarea
              {...removalReasonForm.register('reason')}
              aria-invalid={!!removalReasonForm.formState.errors.reason}
              aria-label="Removal reason"
              placeholder="Enter a reason"
              rows={4}
            />
            {removalReasonForm.formState.errors.reason && (
              <p role="alert" className="text-sm text-destructive">
                {removalReasonForm.formState.errors.reason.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsRemovalReasonDialogOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" variant="destructive">Continue</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          setIsRemovalConfirmationOpen(open);
          if (!open) {
            setListingToRemove(null);
            removalReasonForm.reset({ reason: '' });
          }
        }}
        open={isRemovalConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Confirm removal of ${listingToRemove?.title ?? ''}`}</DialogTitle>
          </DialogHeader>
          <p>{`Remove ${listingToRemove?.title ?? ''}?`}</p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsRemovalConfirmationOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              onClick={submitListingRemoval}
              disabled={removeListing.isPending}
              type="button"
              variant="destructive"
            >
              Confirm removal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ListingModeration;
