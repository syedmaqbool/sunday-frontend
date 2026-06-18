import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, ArrowLeft, MessageSquare, Loader2, LifeBuoy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  pending: { label: "Replied", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

const STATUSES = ["open", "pending", "resolved", "closed"];

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  last_message_at: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface Msg {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: "ticket-1",
    user_id: "mock-user-id",
    subject: "Payment not reflecting after order",
    category: "Payments",
    status: "open",
    last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_name: "Muhamad Bilal Shaikh",
  },
  {
    id: "ticket-2",
    user_id: "mock-buyer-2",
    subject: "Item arrived damaged",
    category: "Returns",
    status: "pending",
    last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: "Ayesha Khan",
  },
  {
    id: "ticket-3",
    user_id: "mock-buyer-3",
    subject: "How do I change my bank account for payouts?",
    category: "Account",
    status: "resolved",
    last_message_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: "Sana Malik",
  },
  {
    id: "ticket-4",
    user_id: "mock-buyer-4",
    subject: "Old issue resolved last month",
    category: "General",
    status: "closed",
    last_message_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: "Hassan Raza",
  },
];

let mockTicketsStore: Ticket[] = [...MOCK_TICKETS];

let mockMessagesStore: Record<string, Msg[]> = {
  "ticket-1": [
    {
      id: "msg-1",
      ticket_id: "ticket-1",
      sender_id: "mock-user-id",
      sender_role: "user",
      content: "Hi, I placed an order but my payment isn't showing as confirmed. Order #ord-8fdf392k.",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-2",
      ticket_id: "ticket-1",
      sender_id: "mock-user-id",
      sender_role: "user",
      content: "Any update on this?",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ],
  "ticket-2": [
    {
      id: "msg-3",
      ticket_id: "ticket-2",
      sender_id: "mock-buyer-2",
      sender_role: "user",
      content: "The sneakers I received have a torn sole, doesn't match the listing photos.",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-4",
      ticket_id: "ticket-2",
      sender_id: "admin-mock-id",
      sender_role: "admin",
      content: "Sorry to hear that! Could you share a photo of the damage so we can process a return?",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "ticket-3": [
    {
      id: "msg-5",
      ticket_id: "ticket-3",
      sender_id: "mock-buyer-3",
      sender_role: "user",
      content: "How can I update my bank details for payouts?",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-6",
      ticket_id: "ticket-3",
      sender_id: "admin-mock-id",
      sender_role: "admin",
      content: "You can update it anytime from your Profile page under 'Payout details'.",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "ticket-4": [
    {
      id: "msg-7",
      ticket_id: "ticket-4",
      sender_id: "mock-buyer-4",
      sender_role: "user",
      content: "Thanks for resolving my earlier issue!",
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminSupport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["admin-support-tickets", statusFilter],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        const filtered = statusFilter === "all"
          ? mockTicketsStore
          : mockTicketsStore.filter((t) => t.status === statusFilter);
        return [...filtered].sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
        );
      }

      let q = supabase.from("support_tickets").select("*").order("last_message_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;

      // Enrich with profile name
      const enriched = await Promise.all(
        (data || []).map(async (t: any) => {
          const { data: prof } = await supabase
            .from("profiles").select("full_name").eq("id", t.user_id).maybeSingle();
          return { ...t, user_name: prof?.full_name || "User" };
        })
      );
      return enriched as Ticket[];
    },
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ["admin-support-messages", activeTicket],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return mockMessagesStore[activeTicket!] ?? [];
      }
      const { data, error } = await supabase
        .from("support_messages").select("*")
        .eq("ticket_id", activeTicket!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Msg[];
    },
    enabled: !!activeTicket,
    refetchInterval: NEXT_PUBLIC_USE_MOCK_DATA ? false : 3000,
  });

  useEffect(() => {
    if (!activeTicket || NEXT_PUBLIC_USE_MOCK_DATA) return;
    const channel = supabase
      .channel(`admin-support-${activeTicket}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "support_messages",
        filter: `ticket_id=eq.${activeTicket}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-support-messages", activeTicket] });
        queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, queryClient]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply.trim() || !activeTicket) return;

      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        const newMsg: Msg = {
          id: `msg-${Date.now()}`,
          ticket_id: activeTicket,
          sender_id: "admin-mock-id",
          sender_role: "admin",
          content: reply.trim(),
          created_at: new Date().toISOString(),
        };
        mockMessagesStore[activeTicket] = [...(mockMessagesStore[activeTicket] ?? []), newMsg];
        mockTicketsStore = mockTicketsStore.map((t) =>
          t.id === activeTicket ? { ...t, last_message_at: newMsg.created_at, status: "pending" } : t,
        );
        return;
      }

      if (!user) return;
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: activeTicket,
        sender_id: user.id,
        sender_role: "admin",
        content: reply.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages", activeTicket] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (e: Error) => toast({ title: "Couldn't send", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!activeTicket) return;

      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        mockTicketsStore = mockTicketsStore.map((t) =>
          t.id === activeTicket ? { ...t, status: newStatus } : t,
        );
        return;
      }

      const { error } = await supabase.from("support_tickets")
        .update({ status: newStatus }).eq("id", activeTicket);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });

  const activeTicketData = tickets.find((t) => t.id === activeTicket);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LifeBuoy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Support Inbox</h1>
          <p className="text-sm text-muted-foreground">Reply to customer support tickets in real time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Ticket list */}
        <Card className={`md:col-span-1 ${activeTicket ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="p-3 border-b border-border">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tickets</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_VARIANTS[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {ticketsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No tickets here.</p>
                </div>
              ) : (
                tickets.map((t) => {
                  const v = STATUS_VARIANTS[t.status] || STATUS_VARIANTS.open;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicket(t.id)}
                      className={`w-full text-left p-3 border-b border-border hover:bg-accent/50 transition-colors ${activeTicket === t.id ? "bg-accent" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                        <Badge variant="outline" className={`text-[10px] ${v.className}`}>{v.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{t.user_name} · {t.category}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(t.last_message_at), "MMM d, h:mm a")}</p>
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card className={`md:col-span-2 flex flex-col ${!activeTicket ? "hidden md:flex" : ""}`}>
          {activeTicket && activeTicketData ? (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveTicket(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{activeTicketData.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{activeTicketData.user_name} · {activeTicketData.category}</p>
                </div>
                <Select value={activeTicketData.status} onValueChange={(v) => updateStatus.mutate(v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_VARIANTS[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1 p-4">
                {msgsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isAdmin = m.sender_role === "admin";
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div className="flex flex-col gap-1 max-w-[80%]">
                            <span className="text-[11px] font-medium px-1 text-muted-foreground">
                              {isAdmin ? "You (Support)" : activeTicketData.user_name}
                            </span>
                            <div className={`rounded-2xl px-4 py-2.5 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                              <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
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
                    placeholder="Reply to customer…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    maxLength={2000}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!reply.trim() || sendReply.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-2" />
              <p className="text-sm">Select a ticket to start replying</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminSupport;