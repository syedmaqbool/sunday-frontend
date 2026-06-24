import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";
import { tokenStorage } from "@/lib/tokenStorage";

import {
  useConversations,
  useConversationMessages,
  useSendMessage,
} from "@/hooks/useConverstion";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  Send,
  ArrowLeft,
  MessageSquare,
  Loader2,
} from "lucide-react";

/* TYPES */

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  offerId: string;
  buyerFullName: string;
  sellerFullName: string;
  listingTitle: string;
  lastMessageContent: string | null;
  lastMessageCreatedAt: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  flagReasons: string[];
  isFlagged: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* COMPONENT */

const Messages = () => {
  const { user, loading: authLoading } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeConvo, setActiveConvo] = useState<string | null>(
    searchParams.get("conversation")
  );

  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* AUTH */

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  /* FETCH CONVERSATIONS */

  const {
    data: conversations = [],
    isLoading: convosLoading,
  } = useConversations();

  /* FETCH MESSAGES */

  const {
    data: messages = [],
    isLoading: msgsLoading,
  } = useConversationMessages(activeConvo || undefined);

  /* SEND MESSAGE */

  const sendMessage = useSendMessage();

  /* WEBSOCKET */

  useEffect(() => {
    if (!user) return;

    const token = tokenStorage.getAccess();
    if (!token) return;

    const base =
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:3000";

    const wsUrl =
      base
        .replace("http://", "ws://")
        .replace("https://", "wss://") +
      `/api/v1/me/realtime/stream?token=${encodeURIComponent(
        token
      )}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("websocket connected");
    };

    socket.onmessage = () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });

      if (activeConvo) {
        queryClient.invalidateQueries({
          queryKey: ["messages", activeConvo],
        });
      }
    };

    socket.onerror = (err) => {
      console.error("websocket error", err);
    };

    socket.onclose = () => {
      console.log("websocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [user, activeConvo, queryClient]);

  /* AUTO SCROLL */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const activeConversation = conversations.find(
    (c: Conversation) => c.id === activeConvo
  );

  if (authLoading) return null;
    return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-bold mb-4">
          Messages
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">

          {/* LEFT SIDEBAR */}

          <Card
            className={`md:col-span-1 ${
              activeConvo ? "hidden md:block" : ""
            }`}
          >
            <CardContent className="p-0">

              <ScrollArea className="h-[calc(100vh-280px)] min-h-[440px]">

                {convosLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>

                ) : conversations.length === 0 ? (

                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No conversations
                    </p>
                  </div>

                ) : (

                  conversations.map((conversation: Conversation) => {
                    const otherName =
                      conversation.buyerId === user?.id
                        ? conversation.sellerFullName
                        : conversation.buyerFullName;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() =>
                          setActiveConvo(conversation.id)
                        }
                        className={`w-full p-3 border-b text-left hover:bg-accent/50 transition-colors ${
                          activeConvo === conversation.id
                            ? "bg-accent"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">

                          <p className="text-sm font-medium truncate">
                            {otherName}
                          </p>

                          {conversation.unreadCount > 0 && (
                            <Badge className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {conversation.listingTitle}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {conversation.lastMessageContent ??
                            "No messages"}
                        </p>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* CHAT */}

          <Card
            className={`md:col-span-2 flex flex-col ${
              !activeConvo ? "hidden md:flex" : ""
            }`}
          >
            {activeConvo && activeConversation ? (
              <>
                {/* HEADER */}

                <div className="flex items-center gap-3 p-3 border-b">

                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setActiveConvo(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div>
                    <p className="text-sm font-medium">
                      {activeConversation.buyerId ===
                      user?.id
                        ? activeConversation.sellerFullName
                        : activeConversation.buyerFullName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {activeConversation.listingTitle}
                    </p>
                  </div>
                </div>

                {/* MESSAGE LIST */}

                <ScrollArea className="flex-1 p-4">

                  {msgsLoading ? (

                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>

                  ) : messages.length === 0 ? (

                    <p className="text-center text-sm text-muted-foreground py-8">
                      Start conversation
                    </p>

                  ) : (

                    <div className="space-y-3">

                      {messages.map((message: Message) => {
                        const isMine =
                          message.senderId === user?.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isMine
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div className="max-w-[75%]">

                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isMine
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">
                                  {message.content}
                                </p>

                                <p
                                  className={`text-[10px] mt-1 ${
                                    isMine
                                      ? "text-primary-foreground/60"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {format(
                                    new Date(
                                      message.createdAt
                                    ),
                                    "MMM d, h:mm a"
                                  )}
                                </p>
                              </div>

                              {message.isFlagged && (
                                <p className="text-xs text-yellow-500 mt-1">
                                  flagged message
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* INPUT */}

                <div className="p-3 border-t">

                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();

                      if (
                        !activeConvo ||
                        !newMessage.trim()
                      )
                        return;

                      sendMessage.mutate(
                        {
                          conversationId: activeConvo,
                          content: newMessage,
                        },
                        {
                          onSuccess: () => {
                            setNewMessage("");
                          },
                        }
                      );
                    }}
                  >
                    <Input
                      placeholder="Type message..."
                      value={newMessage}
                      onChange={(e) =>
                        setNewMessage(e.target.value)
                      }
                      className="flex-1"
                    />

                    <Button
                      type="submit"
                      size="icon"
                      disabled={
                        !newMessage.trim() ||
                        sendMessage.isPending
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
                <MessageSquare className="h-12 w-12 mb-2" />
                <p>Select a conversation</p>
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