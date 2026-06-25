import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import Footer from '@/components/Footer';

import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

import {
  useCreateSupportTicket,
  useSendSupportMessage,
  useSupportMessages,
  useSupportTickets,
} from '@/hooks/useSupport';

const ticketSchema = z.object({
  category: z.string().min(1),
  message: z.string().trim().min(10).max(2000),
  subject: z.string().trim().min(3).max(150),
});

const CATEGORIES = [
  { label: 'General question', value: 'general' },
  { label: 'Order issue', value: 'order' },
  { label: 'Payment & refunds', value: 'payment' },
  { label: 'Account & login', value: 'account' },
  { label: 'Listing problem', value: 'listing' },
  { label: 'Other', value: 'other' },
];

const STATUS_VARIANTS: Record<string, { className: string; label: string }> = {
  CLOSED: {
    className: 'bg-muted text-muted-foreground border-border',
    label: 'Closed',
  },
  IN_PROGRESS: {
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    label: 'In Progress',
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

function Support() {
  const { loading: authLoading, user } = useAuth();

  const navigate = useNavigate();
  const [searchParameters, setSearchParameters] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeTicket, setActiveTicket] = useState<string | null>(
    searchParameters.get('ticket'),
  );

  const [tab, setTab] = useState<string>(
    searchParameters.get('ticket') ? 'chat' : 'tickets',
  );

  const [newMessage, setNewMessage] = useState('');

  const messagesEndReference = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // GET tickets
  const { data: ticketsResponse, isLoading: ticketsLoading }
    = useSupportTickets();

  const tickets = ticketsResponse ?? [];

  // GET messages
  const { data: messagesResponse, isLoading: messagesLoading }
    = useSupportMessages(activeTicket || '');

  const messages = useMemo(() => messagesResponse ?? [], [messagesResponse]);

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  // CREATE ticket
  const createTicket = useCreateSupportTicket();

  const handleCreateTicket = () => {
    const parsed = ticketSchema.safeParse({
      category,
      message,
      subject,
    });

    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];

      toast({
        description: first || 'Check input',
        title: 'Validation error',
        variant: 'destructive',
      });

      return;
    }

    createTicket.mutate(
      {
        content: parsed.data.message, // backend wants content only
        subject: parsed.data.subject,
      },
      {
        onError: (error: Error) => {
          toast({
            description: error.message,
            title: 'Error',
            variant: 'destructive',
          });
        },

        onSuccess: (response) => {
          toast({
            description: 'Support ticket created successfully.',
            title: 'Ticket created',
          });

          setSubject('');
          setCategory('general');
          setMessage('');

          setActiveTicket(response.data.id);
          setTab('chat');

          setSearchParameters({
            ticket: response.data.id,
          });

          queryClient.invalidateQueries({
            queryKey: ['support-tickets'],
          });
        },
      },
    );
  };

  // SEND reply
  const sendReply = useSendSupportMessage();

  const handleSendReply = () => {
    if (!newMessage.trim())
      return;

    sendReply.mutate(
      {
        ticketId: activeTicket!,
        content: newMessage.trim(),
      },
      {
        onSuccess: () => {
          setNewMessage('');

          queryClient.invalidateQueries({
            queryKey: ['support-messages', activeTicket],
          });
        },
      },
    );
  };

  const activeTicketData = tickets.find(t => t.id === activeTicket);

  return (
    authLoading
      ? null
      : (
          <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <main className="container max-w-5xl flex-1 py-6">
              <div className="mb-6 flex items-center gap-3">
                <LifeBuoy className="h-7 w-7 text-primary" />

                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">
                    Customer Support
                  </h1>

                  <p className="text-sm text-muted-foreground">We're here to help.</p>
                </div>
              </div>

              <Tabs onValueChange={setTab} value={tab}>
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
                    <Plus className="mr-1 h-3.5 w-3.5" />
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
                      {ticketsLoading
                        ? (
                            <div className="flex items-center justify-center p-12">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )
                        : (tickets.length === 0
                            ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                  <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />

                                  <p className="mb-4 text-sm text-muted-foreground">
                                    No tickets found
                                  </p>

                                  <Button onClick={() => setTab('new')} size="sm">
                                    <Plus className="mr-1 h-4 w-4" />
                                    New ticket
                                  </Button>
                                </div>
                              )
                            : (
                                <div className="divide-y divide-border">
                                  {tickets.map((t) => {
                                    const variant = STATUS_VARIANTS[t.status];

                                    return (
                                      <button
                                        key={t.id}
                                        onClick={() => {
                                          setActiveTicket(t.id);
                                          setTab('chat');

                                          setSearchParameters({
                                            ticket: t.id,
                                          });
                                        }}
                                        className="
                                          flex w-full items-start gap-3 p-4 text-left transition-colors
                                          hover:bg-accent/50
                                        "
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="mb-1 flex items-center gap-2">
                                            <p className="truncate text-sm font-medium">
                                              {t.subject}
                                            </p>

                                            <Badge
                                              variant="outline"
                                              className={`
                                                text-xs
                                                ${variant?.className}
                                              `}
                                            >
                                              {variant?.label}
                                            </Badge>
                                          </div>

                                          <p className="text-xs text-muted-foreground">
                                            {format(
                                              new Date(t.lastMessageAt),
                                              'MMM d, h:mm a',
                                            )}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
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
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleCreateTicket();
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label>Subject</label>

                          <Input
                            onChange={event => setSubject(event.target.value)}
                            value={subject}
                          />
                        </div>

                        <div className="space-y-2">
                          <label>Category</label>

                          <Select onValueChange={setCategory} value={category}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              {CATEGORIES.map(c => (
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
                            onChange={event => setMessage(event.target.value)}
                            value={message}
                            rows={6}
                          />
                        </div>

                        <Button disabled={createTicket.isPending} type="submit">
                          {createTicket.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                    <Card className="flex h-[calc(100vh-280px)] min-h-[500px] flex-col">
                      {/* Header */}

                      <div className="flex items-center gap-3 border-b border-border p-4">
                        <Button
                          onClick={() => {
                            setTab('tickets');
                            setActiveTicket(null);
                            setSearchParameters({});
                          }}
                          size="icon"
                          variant="ghost"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {activeTicketData?.subject || 'Ticket'}
                          </p>

                          {activeTicketData && (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`
                                  text-xs
                                  ${
                            STATUS_VARIANTS[activeTicketData.status]?.className
                            }
                                `}
                              >
                                {STATUS_VARIANTS[activeTicketData.status]?.label}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Messages */}

                      <ScrollArea className="flex-1 p-4">
                        {messagesLoading
                          ? (
                              <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            )
                          : (
                              <div className="space-y-3">
                                {messages.map((m) => {
                                  const isMine = m.senderId === user?.id;

                                  return (
                                    <div
                                      key={m.id}
                                      className={`
                                        flex
                                        ${
                                    isMine ? 'justify-end' : 'justify-start'
                                    }
                                      `}
                                    >
                                      <div className="flex max-w-[80%] flex-col gap-1">
                                        {!isMine && (
                                          <span className="px-1 text-[11px] font-medium text-primary">
                                            Support team
                                          </span>
                                        )}

                                        <div
                                          className={`
                                            rounded-2xl px-4 py-2.5
                                            ${
                                    isMine
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-foreground'
                                    }
                                          `}
                                        >
                                          <p className="whitespace-pre-wrap text-sm">
                                            {m.content}
                                          </p>

                                          <p
                                            className={`
                                              mt-1 text-[10px]
                                              ${
                                    isMine
                                      ? 'text-primary-foreground/60'
                                      : 'text-muted-foreground'
                                    }
                                            `}
                                          >
                                            {format(
                                              new Date(m.createdAt),
                                              'MMM d, h:mm a',
                                            )}
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

                      {/* Send Message */}

                      <div className="border-t border-border p-3">
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleSendReply();
                          }}
                          className="flex gap-2"
                        >
                          <Input
                            onChange={event => setNewMessage(event.target.value)}
                            value={newMessage}
                            placeholder="Type your reply..."
                            className="flex-1"
                          />

                          <Button
                            disabled={!newMessage.trim() || sendReply.isPending}
                            size="icon"
                            type="submit"
                          >
                            {sendReply.isPending
                              ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )
                              : (
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
        )
  );
}

export default Support;
