import FeedbackHistory from '@/components/FeedbackHistory';
import { useAdminListingFeedback } from '@/hooks/useAdminListingFeedback';

export function AdminListingFeedbackSection({
  listingId,
}: {
  listingId: string;
}) {
  const { data: feedbackList = [] } = useAdminListingFeedback(listingId);
  if (feedbackList.length === 0)
    return null;
  return (
    <div className="mt-4">
      <FeedbackHistory feedbackList={feedbackList} />
    </div>
  );
}
