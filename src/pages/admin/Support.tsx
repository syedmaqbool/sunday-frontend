import { useQuery } from '@tanstack/react-query';
import type { SupportTicketStatus } from '@/types/support.type';

import { format } from 'date-fns';
import {
  ArrowLeft,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  getAdminSupportMessagesOptions,
  getAdminSupportTicketsOptions,
  useReplyToSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
} from '@/queries/adminSupport.query';

// ── Status display ───────────────────────────────────────────────────────────
// Backend enum is OPEN | IN_PROGRESS | RESOLVED | CLOSED
const STATUS_VARIANTS: Record<
  SupportTicketStatus,
  { className: string; label: string }
> = {
  CLOSED: {
    className: 'bg-muted text-muted-foreground border-border',
    label: 'Closed',
  },
  IN_PROGRESS: {
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    label: 'Replied',
  },
  OPEN: {
    className:
      'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    label: 'Open',
  },
  RESOLVED: {
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    label: 'Resolved',
  },
};

const STATUSES: SupportTicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

type StatusFilter = 'all' | SupportTicketStatus;

function AdminSupport() {
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [reply, setReply] = useState('');
  const messagesEndReference = useRef<HTMLDivElement>(null);

  const { data: allTickets = [], isLoading: ticketsLoading } = useQuery(getAdminSupportTicketsOptions());
  const { data: messages = [], isLoading: msgsLoading } = useQuery(getAdminSupportMessagesOptions(activeTicket));

  const sendReply = useReplyToSupportTicketMutation();
  const updateStatus = useUpdateSupportTicketStatusMutation();

  // Client-side status filter — backend list endpoint has no status query param
  const tickets
    = statusFilter === 'all'
      ? allTickets
      : allTickets.filter(t => t.status === statusFilter);

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeTicketData = allTickets.find(t => t.id === activeTicket);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reply.trim() || !activeTicket)
      return;
    sendReply.mutate(
      { ticketId: activeTicket, content: reply.trim() },
      {
        onError: (error: any) =>
          toast({
            description: error.message,
            title: 'Couldn\'t send',
            variant: 'destructive',
          }),
        onSuccess: () => setReply(''),
      },
    );
  };

  const handleStatusChange = (status: SupportTicketStatus) => {
    if (!activeTicket)
      return;
    updateStatus.mutate(
      { ticketId: activeTicket, status },
      { onSuccess: () => toast({ title: 'Status updated' }) },
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <LifeBuoy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Support Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Reply to customer support tickets.
          </p>
        </div>
      </div>

      <div className="
        grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-4
        md:grid-cols-3
      "
      >
        {/* Ticket list */}
        <Card
          className={`
            md:col-span-1
            ${activeTicket
      ? `
        hidden
        md:flex md:flex-col
      `
      : 'flex flex-col'}
          `}
        >
          <div className="border-b border-border p-3">
            <Select
              onValueChange={v => setStatusFilter(v as StatusFilter)}
              value={statusFilter}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tickets</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>
                    {STATUS_VARIANTS[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {ticketsLoading
                ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )
                : (tickets.length === 0
                    ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No tickets here.
                          </p>
                        </div>
                      )
                    : (
                        tickets.map((t) => {
                          const v = STATUS_VARIANTS[t.status];
                          return (
                            <button
                              key={t.id}
                              onClick={() => setActiveTicket(t.id)}
                              className={`
                                w-full border-b border-border p-3 text-left transition-colors
                                hover:bg-accent/50
                                ${activeTicket === t.id ? 'bg-accent' : ''}
                              `}
                            >
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {t.subject}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`
                                    text-[10px]
                                    ${v.className}
                                  `}
                                >
                                  {v.label}
                                </Badge>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {t.userFullName}
                              </p>
                              {t.lastMessageContent && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {t.lastMessageContent}
                                </p>
                              )}
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {format(new Date(t.lastMessageAt), 'MMM d, h:mm a')}
                              </p>
                            </button>
                          );
                        })
                      ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card
          className={`
            flex flex-col
            md:col-span-2
            ${activeTicket
      ? ''
      : `
        hidden
        md:flex
      `}
          `}
        >
          {activeTicket && activeTicketData
            ? (
                <>
                  <div className="flex items-center gap-3 border-b border-border p-3">
                    <Button
                      onClick={() => setActiveTicket(null)}
                      size="icon"
                      variant="ghost"
                      className="md:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {activeTicketData.subject}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activeTicketData.userFullName}
                        {' '}
                        ·
                        {' '}
                        {activeTicketData.userEmail}
                      </p>
                    </div>
                    <Select
                      onValueChange={v =>
                        handleStatusChange(v as SupportTicketStatus)}
                      value={activeTicketData.status}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s} value={s}>
                            {STATUS_VARIANTS[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    {msgsLoading
                      ? (
                          <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )
                      : (
                          <div className="space-y-3">
                            {messages.map((m) => {
                              // No sender_role field — admin message = sender isn't the ticket owner
                              const isAdmin = m.senderId !== activeTicketData.userId;
                              return (
                                <div
                                  key={m.id}
                                  className={`
                                    flex
                                    ${isAdmin ? 'justify-end' : 'justify-start'}
                                  `}
                                >
                                  <div className="flex max-w-[80%] flex-col gap-1">
                                    <span className="px-1 text-[11px] font-medium text-muted-foreground">
                                      {isAdmin ? 'You (Support)' : m.senderFullName}
                                    </span>
                                    <div
                                      className={`
                                        rounded-2xl px-4 py-2.5
                                        ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}
                                      `}
                                    >
                                      <p className="whitespace-pre-wrap text-sm">
                                        {m.content}
                                      </p>
                                      <p
                                        className={`
                                          mt-1 text-[10px]
                                          ${isAdmin ? 'text-primary-foreground/60' : 'text-muted-foreground'}
                                        `}
                                      >
                                        {format(new Date(m.createdAt), 'MMM d, h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndReference} />
                          </div>
                        )}
                  </ScrollArea>

                  <div className="border-t border-border p-3">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <Input
                        onChange={event => setReply(event.target.value)}
                        value={reply}
                        maxLength={2000}
                        placeholder="Reply to customer…"
                        className="flex-1"
                      />
                      <Button
                        disabled={!reply.trim() || sendReply.isPending}
                        size="icon"
                        type="submit"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )
            : (
                <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                  <MessageSquare className="mb-2 h-12 w-12" />
                  <p className="text-sm">Select a ticket to start replying</p>
                </div>
              )}
        </Card>
      </div>
    </div>
  );
}

export default AdminSupport;
