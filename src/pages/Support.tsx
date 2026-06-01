import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ArrowLeft, MessageSquare, Loader2, Plus, LifeBuoy, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150),
  category: z.string().min(1),
  message: z.string().trim().min(10, "Please describe your issue in at least 10 characters").max(2000),
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
  open: { label: "Open", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  pending: { label: "Replied", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  last_message_at: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

const Support = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<string | null>(searchParams.get("ticket"));
  const [tab, setTab] = useState<string>(searchParams.get("ticket") ? "chat" : "tickets");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["support-messages", activeTicket],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", activeTicket!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!activeTicket,
    refetchInterval: 3000,
  });

  // Realtime
  useEffect(() => {
    if (!activeTicket) return;
    const channel = supabase
      .channel(`support-${activeTicket}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "support_messages",
        filter: `ticket_id=eq.${activeTicket}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["support-messages", activeTicket] });
        queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createTicket = useMutation({
    mutationFn: async () => {
      const parsed = ticketSchema.safeParse({ subject, category, message });
      if (!parsed.success) {
        const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
        throw new Error(first || "Please check your input");
      }
      if (!user) throw new Error("Not signed in");

      const { data: ticket, error: tErr } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, subject: parsed.data.subject, category: parsed.data.category })
        .select("id")
        .single();
      if (tErr) throw tErr;

      const { error: mErr } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_role: "user",
          content: parsed.data.message,
        });
      if (mErr) throw mErr;

      // Fire-and-forget confirmation email
      if (user.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "support-confirmation",
            recipientEmail: user.email,
            idempotencyKey: `support-confirm-${ticket.id}`,
            templateData: {
              name: user.user_metadata?.full_name || user.email.split("@")[0],
              subject: parsed.data.subject,
              message: parsed.data.message,
              ticketId: ticket.id,
            },
          },
        }).catch(() => {});
      }

      return ticket.id;
    },
    onSuccess: (ticketId) => {
      toast({ title: "Ticket created", description: "We've emailed you a confirmation. Our team will reply soon." });
      setSubject(""); setCategory("general"); setMessage("");
      setActiveTicket(ticketId);
      setTab("chat");
      setSearchParams({ ticket: ticketId });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err: Error) => toast({ title: "Couldn't submit", description: err.message, variant: "destructive" }),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !activeTicket || !user) return;
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: activeTicket,
        sender_id: user.id,
        sender_role: "user",
        content: newMessage.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["support-messages", activeTicket] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  const activeTicketData = tickets.find((t) => t.id === activeTicket);

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <LifeBuoy className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Customer Support</h1>
            <p className="text-sm text-muted-foreground">We're here to help. Open a ticket or browse your conversations.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tickets">My tickets {tickets.length > 0 && <Badge variant="secondary" className="ml-2">{tickets.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="new"><Plus className="h-3.5 w-3.5 mr-1" /> New ticket</TabsTrigger>
            {activeTicket && <TabsTrigger value="chat">Conversation</TabsTrigger>}
          </TabsList>

          {/* My Tickets */}
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
                    <p className="text-sm text-muted-foreground mb-4">You haven't opened any tickets yet.</p>
                    <Button onClick={() => setTab("new")} size="sm"><Plus className="h-4 w-4 mr-1" /> New ticket</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tickets.map((t) => {
                      const variant = STATUS_VARIANTS[t.status] || STATUS_VARIANTS.open;
                      return (
                        <button
                          key={t.id}
                          onClick={() => { setActiveTicket(t.id); setTab("chat"); setSearchParams({ ticket: t.id }); }}
                          className="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                              <Badge variant="outline" className={`text-xs ${variant.className}`}>{variant.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORIES.find((c) => c.value === t.category)?.label || t.category} · {format(new Date(t.last_message_at), "MMM d, h:mm a")}
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

          {/* New Ticket */}
          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Contact support</CardTitle>
                <CardDescription>Send us your question and we'll reply by email and in-app chat.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => { e.preventDefault(); createTicket.mutate(); }}
                >
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Subject</label>
                    <Input
                      placeholder="Brief summary of your issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={150}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      required
                    />
                    <p className="text-xs text-muted-foreground">{message.length}/2000</p>
                  </div>
                  <Button type="submit" disabled={createTicket.isPending} className="w-full sm:w-auto">
                    {createTicket.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat */}
          {activeTicket && (
            <TabsContent value="chat">
              <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Button variant="ghost" size="icon" onClick={() => { setTab("tickets"); setActiveTicket(null); setSearchParams({}); }}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activeTicketData?.subject || "Ticket"}</p>
                    {activeTicketData && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-xs ${(STATUS_VARIANTS[activeTicketData.status] || STATUS_VARIANTS.open).className}`}>
                          {(STATUS_VARIANTS[activeTicketData.status] || STATUS_VARIANTS.open).label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {CATEGORIES.find((c) => c.value === activeTicketData.category)?.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => {
                        const isMine = m.sender_role === "user";
                        return (
                          <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className="flex flex-col gap-1 max-w-[80%]">
                              {!isMine && (
                                <span className="text-[11px] font-medium text-primary px-1">Support team</span>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                  {format(new Date(m.created_at), "MMM d, h:mm a")}
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

                <div className="p-3 border-t border-border">
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendReply.mutate(); }}>
                    <Input
                      placeholder="Type your reply…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      maxLength={2000}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sendReply.isPending}>
                      <Send className="h-4 w-4" />
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
