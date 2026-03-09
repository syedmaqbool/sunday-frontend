import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CONTACT_PATTERNS = [
  { regex: /\+?\d[\d\s\-\.]{7,}\d/g, label: "phone number" },
  { regex: /@[a-zA-Z0-9_\.]{3,30}/g, label: "social media handle" },
  { regex: /(instagram|insta|whatsapp|telegram|signal|snapchat|tiktok|facebook|fb|twitter|watsapp|wattsapp)/gi, label: "social media platform" },
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: "email address" },
];

const detectContactInfo = (text: string): string | null => {
  for (const p of CONTACT_PATTERNS) {
    if (p.regex.test(text)) {
      p.regex.lastIndex = 0;
      return p.label;
    }
  }
  return null;
};

interface Conversation {
  id: string;
  offer_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing_title?: string;
  listing_image?: string;
  other_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  flagged?: boolean;
  flag_reason?: string;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState<string | null>(searchParams.get("conversation"));
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Fetch conversations
  const { data: conversations = [], isLoading: convosLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with listing info and other user's name
      const enriched: Conversation[] = await Promise.all(
        (data || []).map(async (c: any) => {
          const otherId = c.buyer_id === user!.id ? c.seller_id : c.buyer_id;

          const [listingRes, profileRes, messagesRes] = await Promise.all([
            supabase.from("listings").select("title, images").eq("id", c.listing_id).maybeSingle(),
            supabase.from("profiles").select("full_name").eq("id", otherId).maybeSingle(),
            supabase.from("messages").select("content, created_at, read, sender_id")
              .eq("conversation_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1),
          ]);

          const unreadRes = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("read", false)
            .neq("sender_id", user!.id);

          return {
            ...c,
            listing_title: listingRes.data?.title || "Unknown Listing",
            listing_image: listingRes.data?.images?.[0] || "",
            other_name: profileRes.data?.full_name || "User",
            last_message: messagesRes.data?.[0]?.content || "",
            last_message_at: messagesRes.data?.[0]?.created_at || c.created_at,
            unread_count: unreadRes.count || 0,
          };
        })
      );

      return enriched.sort((a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      );
    },
    enabled: !!user,
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ["messages", activeConvo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvo!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!activeConvo,
    refetchInterval: 3000,
  });

  // Mark messages as read
  useEffect(() => {
    if (!activeConvo || !user || messages.length === 0) return;
    const unread = messages.filter((m) => !m.read && m.sender_id !== user.id);
    if (unread.length > 0) {
      supabase
        .from("messages")
        .update({ read: true })
        .in("id", unread.map((m) => m.id))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        });
    }
  }, [messages, activeConvo, user, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConvo}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !activeConvo || !user) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConvo,
        sender_id: user.id,
        content: newMessage.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvo] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const activeConversation = conversations.find((c) => c.id === activeConvo);

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Messages</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conversation List */}
          <Card className={`md:col-span-1 ${activeConvo ? "hidden md:block" : ""}`}>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)] min-h-[440px]">
                {convosLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Conversations are created when an offer is accepted.
                    </p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvo(c.id)}
                      className={`w-full flex items-center gap-3 p-3 border-b border-border text-left transition-colors hover:bg-accent/50 ${
                        activeConvo === c.id ? "bg-accent" : ""
                      }`}
                    >
                      {c.listing_image ? (
                        <img
                          src={c.listing_image}
                          alt=""
                          className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {c.other_name}
                          </p>
                          {(c.unread_count ?? 0) > 0 && (
                            <Badge variant="default" className="ml-1 text-xs h-5 min-w-[20px] justify-center">
                              {c.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.listing_title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {c.last_message || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`md:col-span-2 flex flex-col ${!activeConvo ? "hidden md:flex" : ""}`}>
            {activeConvo && activeConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setActiveConvo(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {activeConversation.listing_image && (
                    <img
                      src={activeConversation.listing_image}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activeConversation.other_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activeConversation.listing_title}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {msgsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Start the conversation!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => {
                        const isMine = m.sender_id === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                isMine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                                }`}
                              >
                                {format(new Date(m.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border">
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage.mutate();
                    }}
                  >
                    <Input
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-2" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
