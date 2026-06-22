import { useState } from "react";
import {
  useFlaggedMessages,
  useDismissFlag,
  useDeleteMessage,
} from "@/queries/useAdminMessageModeration";
import type { FlaggedMessage } from "@/services/messageModeration.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Trash2, Loader2, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const MessageModeration = () => {
  const [selected, setSelected] = useState<FlaggedMessage | null>(null);

  const { data: flaggedMessages = [], isLoading } = useFlaggedMessages();
  const dismissFlag  = useDismissFlag();
  const deleteMsg    = useDeleteMessage();

  const handleDismiss = (messageId: string) => {
    dismissFlag.mutate(messageId, {
      onSuccess: () => { toast.success("Flag dismissed"); setSelected(null); },
      onError:   () => toast.error("Failed to dismiss flag"),
    });
  };

  const handleDelete = (messageId: string) => {
    deleteMsg.mutate(messageId, {
      onSuccess: () => { toast.success("Message removed"); setSelected(null); },
      onError:   () => toast.error("Failed to remove message"),
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

      {isLoading ? (
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
          {flaggedMessages.map((msg) => (
            <Card key={msg.id} className="group">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {msg.senderId === msg.buyerId ? msg.buyerFullName : msg.sellerFullName}
                    </span>
                    {msg.flagReasons.map((reason) => (
                      <Badge key={reason} variant="destructive" className="text-[10px]">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{msg.content}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(new Date(msg.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(msg)}>
                    <Eye className="h-4 w-4" /> Review
                  </Button>
                  <Button
                    size="sm" variant="outline" className="gap-1 text-primary"
                    onClick={() => handleDismiss(msg.id)}
                    disabled={dismissFlag.isPending}
                  >
                    <CheckCircle className="h-4 w-4" /> Dismiss
                  </Button>
                  <Button
                    size="sm" variant="outline" className="gap-1 text-destructive"
                    onClick={() => handleDelete(msg.id)}
                    disabled={deleteMsg.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <DialogTitle className="font-heading text-xl">Message Review</DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Listing: {selected.listingTitle}
                </p>
              </DialogHeader>

              {/* Flagged message */}
              <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {selected.flagReasons.map((reason) => (
                    <span key={reason} className="text-sm font-semibold text-destructive">{reason}</span>
                  ))}
                </div>
                <p className="text-sm text-foreground">{selected.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent by {selected.senderId === selected.buyerId ? selected.buyerFullName : selected.sellerFullName}
                  {" · "}
                  {format(new Date(selected.createdAt), "MMM d 'at' h:mm a")}
                </p>
              </div>

              {/* Context info */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
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
                  <span className="text-muted-foreground">Conversation started</span>
                  <span>{format(new Date(selected.conversationCreatedAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender role</span>
                  <span>{selected.senderId === selected.buyerId ? "Buyer" : "Seller"}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-border pt-4">
                <Button
                  className="flex-1 gap-2" variant="outline"
                  onClick={() => handleDismiss(selected.id)}
                  disabled={dismissFlag.isPending || deleteMsg.isPending}
                >
                  <CheckCircle className="h-4 w-4" /> Dismiss Flag
                </Button>
                <Button
                  className="flex-1 gap-2" variant="destructive"
                  onClick={() => handleDelete(selected.id)}
                  disabled={dismissFlag.isPending || deleteMsg.isPending}
                >
                  <Trash2 className="h-4 w-4" /> Remove Message
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageModeration;