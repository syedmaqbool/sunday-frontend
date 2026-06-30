import { useQuery } from '@tanstack/react-query';
import type { FlaggedMessage } from '@/types/adminMessageModeration.type';

import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Loader2,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
  getFlaggedMessagesOptions,
  useDeleteMessageMutation,
  useDismissFlagMutation,
} from '@/queries/adminMessageModeration.query';

function MessageModeration() {
  const [selected, setSelected] = useState<FlaggedMessage | null>(null);

  const { data: flaggedMessages = [], isLoading } = useQuery(getFlaggedMessagesOptions());
  const dismissFlag = useDismissFlagMutation();
  const deleteMessage = useDeleteMessageMutation();

  const handleDismiss = (messageId: string) => {
    dismissFlag.mutate(messageId, {
      onError: () => toast.error('Failed to dismiss flag'),
      onSuccess: () => {
        toast.success('Flag dismissed');
        setSelected(null);
      },
    });
  };

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate(messageId, {
      onError: () => toast.error('Failed to remove message'),
      onSuccess: () => {
        toast.success('Message removed');
        setSelected(null);
      },
    });
  };

  return (
    <div>
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Message Moderation
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review flagged messages containing potential contact information.
        </p>
      </div>

      {isLoading
        ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )
        : (flaggedMessages.length === 0
            ? (
                <div className="mt-8 flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12" />
                  <p className="text-lg font-medium">All clear!</p>
                  <p className="text-sm">No flagged messages to review</p>
                </div>
              )
            : (
                <div className="mt-6 space-y-3">
                  {flaggedMessages.map(message => (
                    <Card key={message.id} className="group">
                      <CardContent className="
                        flex flex-col gap-3 p-4
                        sm:flex-row sm:items-center
                      "
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {message.senderId === message.buyerId
                                ? message.buyerFullName
                                : message.sellerFullName}
                            </span>
                            {message.flagReasons.map(reason => (
                              <Badge
                                key={reason}
                                variant="destructive"
                                className="text-[10px]"
                              >
                                {reason}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {message.content}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            onClick={() => setSelected(message)}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {' '}
                            Review
                          </Button>
                          <Button
                            onClick={() => handleDismiss(message.id)}
                            disabled={dismissFlag.isPending}
                            size="sm"
                            variant="outline"
                            className="gap-1 text-primary"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {' '}
                            Dismiss
                          </Button>
                          <Button
                            onClick={() => handleDelete(message.id)}
                            disabled={deleteMessage.isPending}
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            {' '}
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}

      {/* Review dialog */}
      <Dialog
        onOpenChange={open => !open && setSelected(null)}
        open={!!selected}
      >
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <DialogTitle className="font-heading text-xl">
                    Message Review
                  </DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Listing:
                  {' '}
                  {selected.listingTitle}
                </p>
              </DialogHeader>

              {/* Flagged message */}
              <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {selected.flagReasons.map(reason => (
                    <span
                      key={reason}
                      className="text-sm font-semibold text-destructive"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-foreground">{selected.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent by
                  {' '}
                  {selected.senderId === selected.buyerId
                    ? selected.buyerFullName
                    : selected.sellerFullName}
                  {' · '}
                  {format(new Date(selected.createdAt), 'MMM d \'at\' h:mm a')}
                </p>
              </div>

              {/* Context info */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversation Context
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer</span>
                  <span className="font-medium">{selected.buyerFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-medium">{selected.sellerFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listing</span>
                  <span className="font-medium">{selected.listingTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Conversation started
                  </span>
                  <span>
                    {format(
                      new Date(selected.conversationCreatedAt),
                      'MMM d, yyyy',
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender role</span>
                  <span>
                    {selected.senderId === selected.buyerId
                      ? 'Buyer'
                      : 'Seller'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-border pt-4">
                <Button
                  onClick={() => handleDismiss(selected.id)}
                  disabled={dismissFlag.isPending || deleteMessage.isPending}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {' '}
                  Dismiss Flag
                </Button>
                <Button
                  onClick={() => handleDelete(selected.id)}
                  disabled={dismissFlag.isPending || deleteMessage.isPending}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {' '}
                  Remove Message
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MessageModeration;
