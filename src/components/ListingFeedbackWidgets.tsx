import FeedbackHistory from "@/components/FeedbackHistory";
import { useListingFeedback } from "@/hooks/useListingFeedback";

export const ListingFeedbackSection = ({
  listingId,
}: {
  listingId: string;
}) => {
  const { data: feedbackList = [] } = useListingFeedback(listingId);
  if (!feedbackList.length) return null;
  return (
    <div className="mt-4">
      <FeedbackHistory feedbackList={feedbackList} />
    </div>
  );
};

export const ListingFeedbackInline = ({ listingId }: { listingId: string }) => {
  const { data: feedbackList = [] } = useListingFeedback(listingId);
  if (!feedbackList.length) return null;
  return <FeedbackHistory feedbackList={feedbackList} compact />;
};
