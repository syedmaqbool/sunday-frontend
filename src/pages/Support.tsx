import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Send,
  ArrowLeft,
  MessageSquare,
  Loader2,
  Plus,
  LifeBuoy,
  Mail,
} from "lucide-react";

import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

import {
  useSupportTickets,
  useCreateSupportTicket,
  useSupportMessages,
  useSendSupportMessage,
} from "@/hooks/useSupport";

const ticketSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  category: z.string().min(1),
  message: z.string().trim().min(10).max(2000),
});

const CATEGORIES = [
  { value: "general", label: "General question" },
  { value: "order", label: "Order issue" },
  { value: "payment", label: "Payment & refunds" },
  { value: "account", label: "Account & login" },
  { value: "listing", label: "Listing problem" },
  { value: "other", label: "Other" },
];

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: "Open",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  RESOLVED: {
    label: "Resolved",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const Support = () => {
  const { user, loading: authLoading } = useAuth();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeTicket, setActiveTicket] = useState<string | null>(
    searchParams.get("ticket"),
  );

  const [tab, setTab] = useState<string>(
    searchParams.get("ticket") ? "chat" : "tickets",
  );

  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // GET tickets
  const { data: ticketsResponse, isLoading: ticketsLoading } =
    useSupportTickets();

  const tickets = ticketsResponse ?? [];

  // GET messages
  const { data: messagesResponse, isLoading: messagesLoading } =
    useSupportMessages(activeTicket || "");

  const messages = messagesResponse ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // CREATE ticket
  const createTicket = useCreateSupportTicket();

  const handleCreateTicket = () => {
    const parsed = ticketSchema.safeParse({
      subject,
      category,
      message,
    });

    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];

      toast({
        title: "Validation error",
        description: first || "Check input",
        variant: "destructive",
      });

      return;
    }

    createTicket.mutate(
      {
        subject: parsed.data.subject,
        content: parsed.data.message, // backend wants content only
      },
      {
        onSuccess: (res) => {
          toast({
            title: "Ticket created",
            description: "Support ticket created successfully.",
          });

          setSubject("");
          setCategory("general");
          setMessage("");

          setActiveTicket(res.data.id);
          setTab("chat");

          setSearchParams({
            ticket: res.data.id,
          });

          queryClient.invalidateQueries({
            queryKey: ["support-tickets"],
          });
        },

        onError: (err: Error) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  // SEND reply
  const sendReply = useSendSupportMessage();

  const handleSendReply = () => {
    if (!newMessage.trim()) return;

    sendReply.mutate(
      {
        ticketId: activeTicket!,
        content: newMessage.trim(),
      },
      {
        onSuccess: () => {
          setNewMessage("");

          queryClient.invalidateQueries({
            queryKey: ["support-messages", activeTicket],
          });
        },
      },
    );
  };

  const activeTicketData = tickets.find((t) => t.id === activeTicket);

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <LifeBuoy className="h-7 w-7 text-primary" />

          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Customer Support
            </h1>

            <p className="text-sm text-muted-foreground">We're here to help.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tickets">
              My tickets
              {tickets.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {tickets.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="new">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New ticket
            </TabsTrigger>

            {activeTicket && (
              <TabsTrigger value="chat">Conversation</TabsTrigger>
            )}
          </TabsList>

          {/* TICKETS */}

          <TabsContent value="tickets">
            <Card>
              <CardContent className="p-0">
                {ticketsLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />

                    <p className="text-sm text-muted-foreground mb-4">
                      No tickets found
                    </p>

                    <Button onClick={() => setTab("new")} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New ticket
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tickets.map((t) => {
                      const variant = STATUS_VARIANTS[t.status];

                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setActiveTicket(t.id);
                            setTab("chat");

                            setSearchParams({
                              ticket: t.id,
                            });
                          }}
                          className="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">
                                {t.subject}
                              </p>

                              <Badge
                                variant="outline"
                                className={`text-xs ${variant?.className}`}
                              >
                                {variant?.label}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(t.lastMessageAt),
                                "MMM d, h:mm a",
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW TICKET */}

          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact support
                </CardTitle>

                <CardDescription>Send support request</CardDescription>
              </CardHeader>

              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateTicket();
                  }}
                >
                  <div className="space-y-2">
                    <label>Subject</label>

                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label>Category</label>

                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label>Message</label>

                    <Textarea
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <Button type="submit" disabled={createTicket.isPending}>
                    {createTicket.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Submit ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          {/* CHAT */}

          {activeTicket && (
            <TabsContent value="chat">
              <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
                {/* Header */}

                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTab("tickets");
                      setActiveTicket(null);
                      setSearchParams({});
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activeTicketData?.subject || "Ticket"}
                    </p>

                    {activeTicketData && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            STATUS_VARIANTS[activeTicketData.status]?.className
                          }`}
                        >
                          {STATUS_VARIANTS[activeTicketData.status]?.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}

                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => {
                        const isMine = m.senderId === user?.id;

                        return (
                          <div
                            key={m.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div className="flex flex-col gap-1 max-w-[80%]">
                              {!isMine && (
                                <span className="text-[11px] font-medium text-primary px-1">
                                  Support team
                                </span>
                              )}

                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isMine
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">
                                  {m.content}
                                </p>

                                <p
                                  className={`text-[10px] mt-1 ${
                                    isMine
                                      ? "text-primary-foreground/60"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {format(
                                    new Date(m.createdAt),
                                    "MMM d, h:mm a",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Send Message */}

                <div className="p-3 border-t border-border">
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendReply();
                    }}
                  >
                    <Input
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />

                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sendReply.isPending}
                    >
                      {sendReply.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
