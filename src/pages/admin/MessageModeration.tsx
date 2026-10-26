import type { FlaggedMessage, FlaggedMessageHistory } from '@/types/adminMessageModeration.type';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Eye, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConversationMessageAttachments from '@/components/ConversationMessageAttachments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getConversationContextLabel } from '@/lib/conversationContext';
import { showErrorToast } from '@/lib/errorToast';
import {
  getFlaggedConversationOptions,
  getFlaggedMessageHistoryOptions,
  getFlaggedMessagesOptions,
  getResolvedFlaggedConversationOptions,
  messageModerationQueryKey,
  useDeleteMessageMutation,
  useDismissFlagMutation,
} from '@/queries/adminMessageModeration.query';

function MessageModeration() {
  const [selected, setSelected] = useState<FlaggedMessage | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<FlaggedMessageHistory | null>(null);
  const [activeView, setActiveView] = useState<'active' | 'history'>('active');
  const queryClient = useQueryClient();

  const { data: flaggedMessagesResponse, isLoading } = useQuery(getFlaggedMessagesOptions());
  const flaggedMessages = flaggedMessagesResponse?.data ?? [];
  const flaggedConversationQuery = useInfiniteQuery(getFlaggedConversationOptions(selected?.id));
  const historyQuery = useInfiniteQuery(getFlaggedMessageHistoryOptions(activeView === 'history'));
  const historyConversationQuery = useInfiniteQuery(
    getResolvedFlaggedConversationOptions(selectedHistory?.id),
  );
  const reviewQuery = selectedHistory ? historyConversationQuery : flaggedConversationQuery;
  const conversation = reviewQuery.data?.pages[0]?.data;
  const conversationMessages = reviewQuery.data?.pages.flatMap(page => page.data.messages) ?? [];
  const historyItems = historyQuery.data?.pages.flatMap(page => page.data) ?? [];
  const dismissFlag = useDismissFlagMutation();
  const deleteMessage = useDeleteMessageMutation();

  const reloadConversation = () => {
    if (selectedHistory) {
      void queryClient.invalidateQueries({
        queryKey: messageModerationQueryKey.historyConversation(selectedHistory.id),
      });
    } else if (selected) {
      void queryClient.invalidateQueries({
        queryKey: messageModerationQueryKey.conversation(selected.id),
      });
    }
  };

  const openHistoryConversation = (item: FlaggedMessageHistory) => {
    setSelected(null);
    setSelectedHistory(item);
  };

  const closeConversation = () => {
    setSelected(null);
    setSelectedHistory(null);
  };

  const handleDismiss = (messageId: string) => {
    dismissFlag.mutate(messageId, {
      onError: (error: unknown) => showErrorToast(error, 'Failed to dismiss flag'),
      onSuccess: () => {
        toast.success('Flag dismissed');
        setSelected(null);
      },
    });
  };

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate(messageId, {
      onError: (error: unknown) => showErrorToast(error, 'Failed to remove message'),
      onSuccess: () => {
        toast.success('Message removed');
        setSelected(null);
      },
    });
  };

  return (
    <div>
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Message Moderation</h1>
        <p className="mt-1 text-muted-foreground">
          Review flagged messages containing potential contact information.
        </p>
      </div>

      <div aria-label="Message moderation views" className="mt-6 flex gap-2 border-b border-border">
        <Button
          onClick={() => setActiveView('active')}
          aria-pressed={activeView === 'active'}
          variant={activeView === 'active' ? 'default' : 'ghost'}
        >
          Active
        </Button>
        <Button
          onClick={() => setActiveView('history')}
          aria-pressed={activeView === 'history'}
          variant={activeView === 'history' ? 'default' : 'ghost'}
        >
          History
        </Button>
      </div>

      {activeView === 'active' &&
        (isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : flaggedMessages.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12" />
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm">No flagged messages to review</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {flaggedMessages.map(message => (
              <Card key={message.id} className="group">
                <CardContent
                  className="
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
                        <Badge key={reason} variant="destructive" className="text-[10px]">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {message.content}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {getConversationContextLabel(message.type, message.listingTitle)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      onClick={() => setSelected(message)}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" /> Review
                    </Button>
                    <Button
                      onClick={() => handleDismiss(message.id)}
                      disabled={dismissFlag.isPending}
                      size="sm"
                      variant="outline"
                      className="gap-1 text-primary"
                    >
                      <CheckCircle className="h-4 w-4" /> Dismiss
                    </Button>
                    <Button
                      onClick={() => handleDelete(message.id)}
                      disabled={deleteMessage.isPending}
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {activeView === 'history' &&
        (historyQuery.isLoading ? (
          <div role="status" className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading resolved flag history</span>
          </div>
        ) : historyQuery.isError ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <p role="alert" className="text-sm">
              Resolved flag history could not be loaded.
            </p>
            <Button onClick={() => void historyQuery.refetch()} variant="outline">
              Retry history
            </Button>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12" />
            <p className="text-lg font-medium">No recent resolved flags</p>
            <p className="text-sm">Resolved flags are kept here for three months.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {historyItems.map(item => (
              <Card key={item.id}>
                <CardContent
                  className="
                    flex flex-col gap-3 p-4
                    sm:flex-row sm:items-center
                  "
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Sender: {item.senderId}
                      </span>
                      <Badge variant="destructive" className="text-[10px]">
                        {item.flagReasons.join(', ')}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.resolutionAction === 'REMOVED' ? 'Removed' : 'Dismissed'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Resolved {format(new Date(item.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                      {' · Flagged '}
                      {format(new Date(item.flaggedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    onClick={() => openHistoryConversation(item)}
                    aria-label={`Open conversation for ${item.flagReasons.join(', ')} from ${item.senderId}`}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" /> Review
                  </Button>
                </CardContent>
              </Card>
            ))}
            {historyQuery.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  onClick={() => void historyQuery.fetchNextPage()}
                  disabled={historyQuery.isFetchingNextPage}
                  variant="outline"
                >
                  {historyQuery.isFetchingNextPage ? 'Loading history…' : 'Load more history'}
                </Button>
              </div>
            )}
          </div>
        ))}

      {/* Review dialog */}
      <Dialog
        onOpenChange={open => !open && closeConversation()}
        open={!!selected || !!selectedHistory}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {(selected || selectedHistory) && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <DialogTitle className="font-heading text-xl">Conversation Review</DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedHistory ? 'Resolved conversation:' : 'Conversation:'}{' '}
                  {conversation
                    ? getConversationContextLabel(conversation.type, conversation.listingTitle)
                    : selected
                      ? getConversationContextLabel(selected.type, selected.listingTitle)
                      : 'Loading conversation'}
                </p>
              </DialogHeader>

              {selectedHistory && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <Badge variant="destructive">{selectedHistory.flagReasons.join(', ')}</Badge>
                  <span>
                    Flag{' '}
                    {selectedHistory.resolutionAction === 'REMOVED'
                      ? 'removed by moderation'
                      : 'dismissed'}
                    {' · Resolved '}
                    {format(new Date(selectedHistory.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}

              {reviewQuery.isLoading ? (
                <div role="status" className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="sr-only">Loading conversation</span>
                </div>
              ) : reviewQuery.isError ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <p role="alert" className="text-sm text-muted-foreground">
                    Conversation could not be loaded.
                  </p>
                  <Button onClick={reloadConversation} variant="outline">
                    Retry conversation
                  </Button>
                </div>
              ) : (
                conversation && (
                  <>
                    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Conversation Context
                      </p>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Buyer</span>
                        <span className="font-medium">{conversation.buyerFullName}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Seller</span>
                        <span className="font-medium">{conversation.sellerFullName}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          {conversation.type === 'DIRECT' ? 'Conversation type' : 'Listing'}
                        </span>
                        <span className="font-medium">
                          {conversation.type === 'DIRECT'
                            ? 'Direct conversation'
                            : (conversation.listingTitle ?? 'Listing unavailable')}
                        </span>
                      </div>
                    </div>

                    <div
                      aria-label="Conversation messages"
                      role="log"
                      className="max-h-[45vh] space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3"
                    >
                      {selectedHistory?.resolutionAction === 'REMOVED' && (
                        <div className="mb-2 rounded-md border border-muted-foreground/30 bg-background p-3 text-sm text-muted-foreground">
                          Message removed by moderation
                        </div>
                      )}
                      {conversationMessages.map(message => {
                        const isMessageFlagged =
                          message.isFlagged ||
                          message.id === selected?.id ||
                          message.id === selectedHistory?.messageId;
                        const displayedFlagReasons = [
                          ...new Set([
                            ...message.flagReasons,
                            ...((selectedHistory?.messageId === message.id &&
                              selectedHistory.flagReasons) ||
                              []),
                          ]),
                        ];

                        return (
                          <div
                            key={message.id}
                            className={`
                              rounded-md border p-3 text-sm
                              ${
                                isMessageFlagged
                                  ? 'border-destructive/40 bg-destructive/10'
                                  : 'border-transparent bg-background'
                              }
                            `}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                {message.senderRole === 'BUYER'
                                  ? `Buyer · ${conversation.buyerFullName}`
                                  : `Seller · ${conversation.sellerFullName}`}
                              </span>
                              <time
                                dateTime={message.createdAt}
                                className="text-[10px] text-muted-foreground"
                              >
                                {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </time>
                              {isMessageFlagged &&
                                displayedFlagReasons.map(reason => (
                                  <Badge key={reason} variant="destructive" className="text-[10px]">
                                    {reason}
                                  </Badge>
                                ))}
                            </div>
                            <ConversationMessageAttachments
                              onReload={reloadConversation}
                              attachments={message.attachments}
                            />
                            {message.content && (
                              <p className="mt-1 whitespace-pre-wrap text-foreground">
                                {message.content}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {reviewQuery.hasNextPage && (
                      <div className="flex justify-center">
                        <Button
                          onClick={() => void reviewQuery.fetchNextPage()}
                          disabled={reviewQuery.isFetchingNextPage}
                          variant="outline"
                        >
                          {reviewQuery.isFetchingNextPage
                            ? 'Loading messages…'
                            : 'Load more messages'}
                        </Button>
                      </div>
                    )}
                  </>
                )
              )}

              {/* Actions */}
              {!selectedHistory && selected && (
                <div className="flex gap-3 border-t border-border pt-4">
                  <Button
                    onClick={() => handleDismiss(selected.id)}
                    disabled={dismissFlag.isPending || deleteMessage.isPending}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Dismiss Flag
                  </Button>
                  <Button
                    onClick={() => handleDelete(selected.id)}
                    disabled={dismissFlag.isPending || deleteMessage.isPending}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Remove Message
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MessageModeration;
