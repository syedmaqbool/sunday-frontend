import type { Message } from '@/types/conversation.type';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ConversationMessageAttachmentsProperties {
  attachments?: Message['attachments'];
  onReload: () => void;
}

function ConversationMessageAttachments({
  attachments = [],
  onReload,
}: ConversationMessageAttachmentsProperties) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mb-1 grid grid-cols-2 gap-1.5">
      {attachments.map(attachment => (
        <ConversationMessageAttachment
          key={attachment.id}
          onReload={onReload}
          attachment={attachment}
        />
      ))}
    </div>
  );
}

function ConversationMessageAttachment({
  attachment,
  onReload,
}: {
  attachment: Message['attachments'][number];
  onReload: () => void;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (failedUrl === attachment.url) {
    return (
      <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg bg-muted p-2 text-center">
        <p role="alert" className="text-xs text-muted-foreground">
          Media is unavailable. Reload the conversation to refresh it.
        </p>
        <Button onClick={onReload} size="sm" type="button" variant="outline">
          Reload conversation
        </Button>
      </div>
    );
  }

  if (attachment.type === 'VIDEO') {
    return (
      <video
        src={attachment.url}
        onError={() => setFailedUrl(attachment.url)}
        aria-label={attachment.filename}
        controls
        className="h-40 w-full rounded-lg bg-muted object-cover"
      />
    );
  }

  return (
    <a href={attachment.url} rel="noreferrer" target="_blank">
      <img
        src={attachment.url}
        onError={() => setFailedUrl(attachment.url)}
        alt={attachment.filename}
        className="h-28 w-full rounded-lg object-cover"
      />
    </a>
  );
}

export default ConversationMessageAttachments;
