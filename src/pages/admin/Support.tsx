import { useState, useEffect, useRef } from "react";
import {
  useAdminSupportTickets,
  useAdminSupportMessages,
  useReplyToSupportTicket,
  useUpdateSupportTicketStatus,
} from "@/queries/useAdminSupport";
import type { SupportTicket, SupportTicketStatus } from "@/services/adminSupport.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, ArrowLeft, MessageSquare, Loader2, LifeBuoy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

// ── Status display ───────────────────────────────────────────────────────────
// Backend enum is OPEN | IN_PROGRESS | RESOLVED | CLOSED
const STATUS_VARIANTS: Record<SupportTicketStatus, { label: string; className: string }> = {
  OPEN:        { label: "Open",     className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  IN_PROGRESS: { label: "Replied",  className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  RESOLVED:    { label: "Resolved", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  CLOSED:      { label: "Closed",   className: "bg-muted text-muted-foreground border-border" },
};

const STATUSES: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

type StatusFilter = "all" | SupportTicketStatus;

const AdminSupport = () => {
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: allTickets = [], isLoading: ticketsLoading } = useAdminSupportTickets();
  const { data: messages = [], isLoading: msgsLoading } = useAdminSupportMessages(activeTicket);

  const sendReply = useReplyToSupportTicket();
  const updateStatus = useUpdateSupportTicketStatus();

  // Client-side status filter — backend list endpoint has no status query param
  const tickets = statusFilter === "all"
    ? allTickets
    : allTickets.filter((t) => t.status === statusFilter);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeTicketData = allTickets.find((t) => t.id === activeTicket);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeTicket) return;
    sendReply.mutate(
      { ticketId: activeTicket, content: reply.trim() },
      {
        onSuccess: () => setReply(""),
        onError: (err: any) =>
          toast({ title: "Couldn't send", description: err.message, variant: "destructive" }),
      },
    );
  };

  const handleStatusChange = (status: SupportTicketStatus) => {
    if (!activeTicket) return;
    updateStatus.mutate(
      { ticketId: activeTicket, status },
      { onSuccess: () => toast({ title: "Status updated" }) },
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LifeBuoy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Support Inbox</h1>
          <p className="text-sm text-muted-foreground">Reply to customer support tickets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Ticket list */}
        <Card className={`md:col-span-1 ${activeTicket ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="p-3 border-b border-border">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
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
                  const v = STATUS_VARIANTS[t.status];
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
                      <p className="text-xs text-muted-foreground truncate">{t.userFullName}</p>
                      {t.lastMessageContent && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMessageContent}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(t.lastMessageAt), "MMM d, h:mm a")}
                      </p>
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
                  <p className="text-xs text-muted-foreground truncate">
                    {activeTicketData.userFullName} · {activeTicketData.userEmail}
                  </p>
                </div>
                <Select value={activeTicketData.status} onValueChange={(v) => handleStatusChange(v as SupportTicketStatus)}>
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
                      // No sender_role field — admin message = sender isn't the ticket owner
                      const isAdmin = m.senderId !== activeTicketData.userId;
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div className="flex flex-col gap-1 max-w-[80%]">
                            <span className="text-[11px] font-medium px-1 text-muted-foreground">
                              {isAdmin ? "You (Support)" : m.senderFullName}
                            </span>
                            <div className={`rounded-2xl px-4 py-2.5 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                              <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {format(new Date(m.createdAt), "MMM d, h:mm a")}
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
                <form className="flex gap-2" onSubmit={handleSend}>
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