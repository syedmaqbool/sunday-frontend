import FeedbackHistory from '@/components/FeedbackHistory';
import { useListingFeedback } from '@/hooks/useListingFeedback';

export function ListingFeedbackSection({
  listingId,
}: {
  listingId: string;
}) {
  const { data: feedbackList = [] } = useListingFeedback(listingId);
  if (feedbackList.length === 0)
    return null;
  return (
    <div className="mt-4">
      <FeedbackHistory feedbackList={feedbackList} />
    </div>
  );
}

export function ListingFeedbackInline({ listingId }: { listingId: string }) {
  const { data: feedbackList = [] } = useListingFeedback(listingId);
  if (feedbackList.length === 0)
    return null;
  return <FeedbackHistory compact feedbackList={feedbackList} />;
}
