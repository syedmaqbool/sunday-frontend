import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Footer from '@/components/Footer';

import Navbar from '@/components/Navbar';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import {
  getConversationMessagesOptions,
  getConversationsOptions,
  useSendMessageMutation,
} from '@/hooks/useConverstion';
import { tokenStorage } from '@/lib/tokenStorage';

import { conversationsQueryKey } from '@/queries/conversation.query';

/* TYPES */

interface Conversation {
  id: string;
  buyerId: string;
  listingId: string;
  offerId: string;
  sellerId: string;
  buyerFullName: string;
  lastMessageContent: string | null;
  listingTitle: string;
  sellerFullName: string;
  unreadCount: number;
  lastMessageCreatedAt: string | null;
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

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

type MessageFormValues = z.infer<typeof messageSchema>;

/* COMPONENT */

function Messages() {
  const { loading: authLoading, user } = useAuth();

  const navigate = useNavigate();
  const [searchParameters] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeConvo, setActiveConvo] = useState<string | null>(
    searchParameters.get('conversation'),
  );

  const messagesEndReference = useRef<HTMLDivElement>(null);
  const messageForm = useForm<MessageFormValues>({
    defaultValues: { content: '' },
    mode: 'all',
    resolver: zodResolver(messageSchema),
  });
  const messageContent = messageForm.watch('content');

  /* AUTH */

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  /* FETCH CONVERSATIONS */

  const { data: conversationsResponse, isLoading: convosLoading }
    = useQuery(getConversationsOptions());
  const conversations = conversationsResponse?.data ?? [];

  /* FETCH MESSAGES */

  const { data: messagesResponse, isLoading: msgsLoading }
    = useQuery(getConversationMessagesOptions(activeConvo || undefined));
  const messages = useMemo(() => messagesResponse?.data ?? [], [messagesResponse?.data]);

  /* SEND MESSAGE */

  const sendMessage = useSendMessageMutation();

  const handleSendMessage: SubmitHandler<MessageFormValues> = (values) => {
    if (!activeConvo)
      return;

    sendMessage.mutate(
      {
        conversationId: activeConvo,
        content: values.content,
      },
      {
        onSuccess: () => {
          messageForm.reset();
        },
      },
    );
  };

  /* WEBSOCKET */

  useEffect(() => {
    if (!user)
      return;

    const token = tokenStorage.getAccess();
    if (!token)
      return;

    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

    const wsUrl
      = `${base.replace('http://', 'ws://').replace('https://', 'wss://')
      }/api/v1/me/realtime/stream?token=${encodeURIComponent(token)}`;

    const socket = new WebSocket(wsUrl);

    const handleOpen = () => {
      console.warn('websocket connected');
    };

    const handleMessage = () => {
      queryClient.invalidateQueries({
        queryKey: conversationsQueryKey.all(),
      });

      if (activeConvo) {
        queryClient.invalidateQueries({
          queryKey: conversationsQueryKey.messages(activeConvo),
        });
      }
    };

    const handleError = (error: Event) => {
      console.error('websocket error', error);
    };

    const handleClose = () => {
      console.warn('websocket disconnected');
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('error', handleError);
      socket.close();
    };
  }, [user, activeConvo, queryClient]);

  /* AUTO SCROLL */

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  if (authLoading)
    return null;

  const activeConversation = conversations.find(
    (conversation: Conversation) => conversation.id === activeConvo,
  );
  const hasActiveConversation = Boolean(activeConvo && activeConversation);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container flex-1 py-6">
        <h1 className="mb-4 text-2xl font-bold">Messages</h1>

        <div className="
          grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-4
          md:grid-cols-3
        "
        >
          {/* LEFT SIDEBAR */}

          <Card
            className={`
              md:col-span-1
              ${activeConvo
      ? `
        hidden
        md:block
      `
      : ''}
            `}
          >
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)] min-h-[440px]">
                {convosLoading
                  ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )
                  : (conversations.length === 0
                      ? (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              No conversations
                            </p>
                          </div>
                        )
                      : (
                          conversations.map((conversation: Conversation) => {
                            const otherName
                              = conversation.buyerId === user?.id
                                ? conversation.sellerFullName
                                : conversation.buyerFullName;

                            return (
                              <button
                                key={conversation.id}
                                onClick={() => setActiveConvo(conversation.id)}
                                className={`
                                  w-full border-b p-3 text-left transition-colors
                                  hover:bg-accent/50
                                  ${
                              activeConvo === conversation.id ? 'bg-accent' : ''
                              }
                                `}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="truncate text-sm font-medium">
                                    {otherName}
                                  </p>

                                  {conversation.unreadCount > 0 && (
                                    <Badge className="text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>

                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {conversation.listingTitle}
                                </p>

                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {conversation.lastMessageContent ?? 'No messages'}
                                </p>
                              </button>
                            );
                          })
                        ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* CHAT */}

          <Card
            className={`
              flex flex-col
              md:col-span-2
              ${
    activeConvo
      ? ''
      : `
        hidden
        md:flex
      `
    }
            `}
          >
            {hasActiveConversation
              ? (
                  <>
                    {/* HEADER */}

                    <div className="flex items-center gap-3 border-b p-3">
                      <Button
                        onClick={() => setActiveConvo(null)}
                        size="icon"
                        variant="ghost"
                        className="md:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>

                      <div>
                        <p className="text-sm font-medium">
                          {activeConversation.buyerId === user?.id
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
                      {msgsLoading
                        ? (
                            <div className="flex justify-center p-8">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          )
                        : (messages.length === 0
                            ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                  Start conversation
                                </p>
                              )
                            : (
                                <div className="space-y-3">
                                  {messages.map((message: Message) => {
                                    const isMine = message.senderId === user?.id;

                                    return (
                                      <div
                                        key={message.id}
                                        className={`
                                          flex
                                          ${
                                      isMine ? 'justify-end' : 'justify-start'
                                      }
                                        `}
                                      >
                                        <div className="max-w-[75%]">
                                          <div
                                            className={`
                                              rounded-2xl px-4 py-2
                                              ${
                                      isMine
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                      }
                                            `}
                                          >
                                            <p className="whitespace-pre-wrap text-sm">
                                              {message.content}
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
                                                new Date(message.createdAt),
                                                'MMM d, h:mm a',
                                              )}
                                            </p>
                                          </div>

                                          {message.isFlagged && (
                                            <p className="mt-1 text-xs text-yellow-500">
                                              flagged message
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <div ref={messagesEndReference} />
                                </div>
                              ))}
                    </ScrollArea>

                    {/* INPUT */}

                    <div className="border-t p-3">
                      <form
                        onSubmit={messageForm.handleSubmit(handleSendMessage)}
                        className="flex gap-2"
                      >
                        <Controller
                          name="content"
                          control={messageForm.control}
                          render={({ field }) => (
                            <Input
                              placeholder="Type message..."
                              className="flex-1"
                              {...field}
                            />
                          )}
                        />

                        <Button
                          disabled={!messageContent.trim() || sendMessage.isPending}
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
                    <p>Select a conversation</p>
                  </div>
                )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Messages;
