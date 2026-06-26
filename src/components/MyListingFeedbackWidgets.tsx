import FeedbackHistory from '@/components/FeedbackHistory';
import { useMyListingFeedback } from '@/hooks/useMyListingFeedback';

export function MyListingFeedbackSection({
  listingId,
}: {
  listingId: string;
}) {
  const { data: feedbackList = [] } = useMyListingFeedback(listingId);
  if (feedbackList.length === 0)
    return null;
  return (
    <div className="mt-4">
      <FeedbackHistory feedbackList={feedbackList} />
    </div>
  );
}

export function MyListingFeedbackInline({ listingId }: { listingId: string }) {
  const { data: feedbackList = [] } = useMyListingFeedback(listingId);
  if (feedbackList.length === 0)
    return null;
  return <FeedbackHistory compact feedbackList={feedbackList} />;
}
