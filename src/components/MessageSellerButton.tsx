import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/lib/errorToast';
import { useStartConversationMutation } from '@/queries/conversation.query';
import { getApiErrorCode } from '@/services/ky-base-instance';

const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) });
type MessageFormValues = z.infer<typeof messageSchema>;

const DAILY_CONVERSATION_LIMIT_MESSAGE =
  "You've reached today's limit for new conversations. Try again tomorrow.";

function showMessageSendError(error: Error) {
  if (getApiErrorCode(error) === 'APP_CONVERSATION_DAILY_LIMIT_REACHED') {
    error.message = DAILY_CONVERSATION_LIMIT_MESSAGE;
  }
  showErrorToast(error, 'Failed to send message');
}

type MessageSellerButtonProps =
  | { listingId: string; recipientUserId?: never }
  | { listingId?: never; recipientUserId: string };

export function MessageSellerButton({ listingId, recipientUserId }: MessageSellerButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const form = useForm<MessageFormValues>({
    defaultValues: { content: '' },
    mode: 'all',
    resolver: zodResolver(messageSchema),
  });
  const startConversation = useStartConversationMutation();
  const isListingMessage = !!listingId;

  const onSubmit: SubmitHandler<MessageFormValues> = ({ content }) => {
    const target = listingId ? { listingId } : recipientUserId ? { recipientUserId } : null;

    if (!target) return;

    startConversation.mutate(
      { ...target, content: content.trim() },
      {
        onError: showMessageSendError,
        onSuccess: ({ data }) => {
          form.reset();
          setOpen(false);
          navigate(`/messages?conversation=${encodeURIComponent(data.id)}`);
        },
      },
    );
  };

  if (!user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Button
        onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`)}
        size="lg"
        variant="outline"
        className="
          w-full gap-2
          sm:w-auto
        "
      >
        <MessageSquare className="h-4 w-4" />
        Message seller
      </Button>
    );
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="
            w-full gap-2
            sm:w-auto
          "
        >
          <MessageSquare className="h-4 w-4" />
          Message seller
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message seller</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isListingMessage
              ? 'Send a message about this listing.'
              : 'Send a message to this seller.'}
          </p>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="seller-message">Your message</Label>
          <Controller
            name="content"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="seller-message"
                maxLength={2000}
                placeholder="Ask the seller a question..."
                rows={4}
              />
            )}
          />
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid || startConversation.isPending}
          className="w-full"
        >
          {startConversation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send message
        </Button>
      </DialogContent>
    </Dialog>
  );
}
