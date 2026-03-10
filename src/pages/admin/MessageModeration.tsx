import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Trash2, Loader2, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FlaggedMessage {
  id: string;
  content: string;
  flag_reason: string | null;
  flagged: boolean;
  created_at: string;
  sender_id: string;
  conversation_id: string;
  read: boolean;
  sender_profile?: { full_name: string | null } | null;
  conversation?: {
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    listing?: { title: string } | null;
  } | null;
}

interface ConversationMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  flagged: boolean;
  flag_reason: string | null;
}

const MessageModeration = () => {
  const [selectedMessage, setSelectedMessage] = useState<FlaggedMessage | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const queryClient = useQueryClient();

  const { data: flaggedMessages = [], isLoading } = useQuery({
    queryKey: ["admin-flagged-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender_profile:profiles!messages_sender_id_fkey(full_name)")
        .eq("flagged", true)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallback, error: err2 } = await supabase
          .from("messages")
          .select("*")
          .eq("flagged", true)
          .order("created_at", { ascending: false });
        if (err2) throw err2;
        
        // Fetch profiles separately
        const senderIds = [...new Set((fallback ?? []).map((m: any) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);
        
        const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        
        return (fallback ?? []).map((m: any) => ({
          ...m,
          sender_profile: profileMap.get(m.sender_id) ?? null,
        })) as FlaggedMessage[];
      }
      return (data ?? []) as FlaggedMessage[];
    },
  });

  const openConversation = async (msg: FlaggedMessage) => {
    setSelectedMessage(msg);
    setLoadingConvo(true);
    try {
      // Get conversation details
      const { data: convo } = await supabase
        .from("conversations")
        .select("*, listing:listings(title)")
        .eq("id", msg.conversation_id)
        .maybeSingle();

      if (convo) {
        setSelectedMessage((prev) => prev ? { ...prev, conversation: convo } : prev);
      }

      // Get all messages in this conversation
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at, flagged, flag_reason")
        .eq("conversation_id", msg.conversation_id)
        .order("created_at", { ascending: true });

      setConversationMessages((msgs ?? []) as ConversationMessage[]);
    } finally {
      setLoadingConvo(false);
    }
  };

  const dismissFlag = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ flagged: false, flag_reason: null })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Flag dismissed");
      queryClient.invalidateQueries({ queryKey: ["admin-flagged-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedMessage(null);
    },
    onError: () => toast.error("Failed to dismiss flag"),
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      // Update content to show it was removed by admin
      const { error } = await supabase
        .from("messages")
        .update({ content: "[Message removed by admin]", flagged: false, flag_reason: null })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message removed");
      queryClient.invalidateQueries({ queryKey: ["admin-flagged-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedMessage(null);
    },
    onError: () => toast.error("Failed to remove message"),
  });

  return (
    <div>
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Message Moderation</h1>
        <p className="mt-1 text-muted-foreground">
          Review flagged messages containing potential contact information
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {(msg.sender_profile as any)?.full_name || "Unknown User"}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      {msg.flag_reason || "Flagged"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{msg.content}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openConversation(msg)}>
                    <Eye className="h-4 w-4" /> Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-primary"
                    onClick={() => dismissFlag.mutate(msg.id)}
                    disabled={dismissFlag.isPending}
                  >
                    <CheckCircle className="h-4 w-4" /> Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive"
                    onClick={() => deleteMessage.mutate(msg.id)}
                    disabled={deleteMessage.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conversation review dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <DialogTitle className="font-heading text-xl">
                    Conversation Review
                  </DialogTitle>
                </div>
                {selectedMessage.conversation && (
                  <p className="text-sm text-muted-foreground">
                    Listing: {(selectedMessage.conversation as any)?.listing?.title || "Unknown"}
                  </p>
                )}
              </DialogHeader>

              {/* Flagged message highlight */}
              <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">
                    {selectedMessage.flag_reason}
                  </span>
                </div>
                <p className="text-sm text-foreground">{selectedMessage.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent by {(selectedMessage.sender_profile as any)?.full_name || "Unknown"} · {format(new Date(selectedMessage.created_at), "MMM d 'at' h:mm a")}
                </p>
              </div>

              {/* Conversation context */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversation Context
                </h3>
                {loadingConvo ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
                    {conversationMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-md p-2.5 text-sm ${
                          m.id === selectedMessage.id
                            ? "border border-destructive/40 bg-destructive/10"
                            : "bg-background"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {m.sender_id === selectedMessage.conversation?.buyer_id ? "Buyer" : "Seller"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(m.created_at), "h:mm a")}
                          </span>
                          {m.flagged && m.id !== selectedMessage.id && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">⚠</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-foreground">{m.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-border pt-4">
                <Button
                  className="flex-1 gap-2"
                  variant="outline"
                  onClick={() => dismissFlag.mutate(selectedMessage.id)}
                  disabled={dismissFlag.isPending || deleteMessage.isPending}
                >
                  <CheckCircle className="h-4 w-4" /> Dismiss Flag
                </Button>
                <Button
                  className="flex-1 gap-2"
                  variant="destructive"
                  onClick={() => deleteMessage.mutate(selectedMessage.id)}
                  disabled={dismissFlag.isPending || deleteMessage.isPending}
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
