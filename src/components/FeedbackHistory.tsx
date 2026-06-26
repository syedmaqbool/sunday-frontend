import type { FeedbackEntry } from '@/hooks/useMyListingFeedback';
import { format } from 'date-fns';
import { Clock, MessageSquare } from 'lucide-react';

interface FeedbackHistoryProps {
  compact?: boolean;
  feedbackList: FeedbackEntry[];
}

function FeedbackHistory({
  compact = false,
  feedbackList,
}: FeedbackHistoryProps) {
  if (feedbackList.length === 0)
    return null;

  if (compact) {
    return (
      <div className="mt-2 space-y-1.5">
        {feedbackList.map(fb => (
          <div
            key={fb.id}
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5"
          >
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-destructive">
                  {fb.adminFullName || 'Admin Feedback'}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(fb.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fb.feedback}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">
          Feedback History
        </p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {feedbackList.length}
        </span>
      </div>
      <div className="space-y-2">
        {feedbackList.map(fb => (
          <div
            key={fb.id}
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(fb.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
            </div>
            {fb.adminFullName && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {fb.adminFullName}
              </p>
            )}
            <p className="mt-1.5 text-sm text-foreground">{fb.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedbackHistory;
