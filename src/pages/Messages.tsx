// import type { SubmitHandler } from 'react-hook-form';
// import type { Conversation, Message } from '@/types/conversation.type';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { format } from 'date-fns';
// import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';
// import { useEffect, useMemo, useRef, useState } from 'react';

// import { Controller, useForm } from 'react-hook-form';
// import { Link, useNavigate, useSearchParams } from 'react-router-dom';
// import { z } from 'zod';

// import Footer from '@/components/Footer';

// import Navbar from '@/components/Navbar';
// import { Badge } from '@/components/ui/badge';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useAuth } from '@/contexts/AuthContext';
// import {
//   getConversationMessagesOptions,
//   getConversationsOptions,
//   useMarkConversationReadMutation,
//   useSendMessageMutation,
// } from '@/hooks/useConverstion';

// import { getConversationContextLabel } from '@/lib/conversationContext';
// import { tokenStorage } from '@/lib/tokenStorage';
// import { conversationsQueryKey } from '@/queries/conversation.query';

// /*
//  * TYPES
//  */

// const messageSchema = z.object({
//   content: z.string().trim().min(1).max(2000),
// });

// type MessageFormValues = z.infer<typeof messageSchema>;

// /*
//  * COMPONENT
//  */

// function Messages() {
//   const { loading: authLoading, user } = useAuth();

//   const navigate = useNavigate();
//   const [searchParameters, setSearchParameters] = useSearchParams();
//   const queryClient = useQueryClient();

//   const [activeConvo, setActiveConvo] = useState<string | null>(
//     searchParameters.get('conversation'),
//   );
//   const [documentVisible, setDocumentVisible] = useState(
//     () => document.visibilityState === 'visible',
//   );
//   const markReadInFlight = useRef(new Set<string>());
//   const focusedMessageId = searchParameters.get('message');

//   const messagesEndReference = useRef<HTMLDivElement>(null);
//   const messageForm = useForm<MessageFormValues>({
//     defaultValues: { content: '' },
//     mode: 'all',
//     resolver: zodResolver(messageSchema),
//   });
//   const messageContent = messageForm.watch('content');

//   /*
//    * AUTH
//    */

//   useEffect(() => {
//     if (!authLoading && !user) {
//       navigate('/auth', { replace: true });
//     }
//   }, [user, authLoading, navigate]);

//   /*
//    * FETCH CONVERSATIONS
//    */

//   const { data: conversationsResponse, isLoading: convosLoading }
//     = useQuery(getConversationsOptions());
//   const conversations = useMemo(() => conversationsResponse?.data ?? [], [conversationsResponse?.data]);

//   useEffect(() => {
//     setActiveConvo(searchParameters.get('conversation'));
//   }, [searchParameters]);

//   useEffect(() => {
//     if (convosLoading || !activeConvo || conversations.some(conversation => conversation.id === activeConvo))
//       return;

//     const nextParameters = new URLSearchParams(searchParameters);
//     nextParameters.delete('conversation');
//     nextParameters.delete('message');
//     setActiveConvo(null);
//     setSearchParameters(nextParameters, { replace: true });
//   }, [activeConvo, conversations, convosLoading, searchParameters, setSearchParameters]);

//   /*
//    * FETCH MESSAGES
//    */

//   const { data: messagesResponse, isLoading: msgsLoading }
//     = useQuery(getConversationMessagesOptions(activeConvo || undefined));
//   const messages = useMemo(() => messagesResponse?.data ?? [], [messagesResponse?.data]);

//   const markConversationRead = useMarkConversationReadMutation();

//   useEffect(() => {
//     const updateDocumentVisibility = () => {
//       setDocumentVisible(document.visibilityState === 'visible');
//     };

//     document.addEventListener('visibilitychange', updateDocumentVisibility);
//     return () => document.removeEventListener('visibilitychange', updateDocumentVisibility);
//   }, []);

//   useEffect(() => {
//     if (!activeConvo || msgsLoading || !documentVisible || !user)
//       return;

//     const hasUnreadIncomingMessage = messages.some(
//       message => message.senderId !== user.id && !message.readAt,
//     );
//     if (!hasUnreadIncomingMessage || markReadInFlight.current.has(activeConvo))
//       return;

//     markReadInFlight.current.add(activeConvo);
//     markConversationRead.mutate(activeConvo, {
//       onSettled: () => markReadInFlight.current.delete(activeConvo),
//     });
//   }, [activeConvo, documentVisible, markConversationRead, messages, msgsLoading, user]);

//   useEffect(() => {
//     if (!activeConvo || msgsLoading || !focusedMessageId)
//       return;

//     const focusedMessage = messages.find(message => message.id === focusedMessageId);
//     if (focusedMessage) {
//       const focusedMessageElement = document.querySelector<HTMLDivElement>(`#conversation-message-${CSS.escape(focusedMessage.id)}`);
//       focusedMessageElement?.focus({ preventScroll: true });
//       focusedMessageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       return;
//     }

//     const nextParameters = new URLSearchParams(searchParameters);
//     nextParameters.delete('message');
//     setSearchParameters(nextParameters, { replace: true });
//   }, [activeConvo, focusedMessageId, messages, msgsLoading, searchParameters, setSearchParameters]);

//   const selectConversation = (conversationId: string | null) => {
//     setActiveConvo(conversationId);
//     const nextParameters = new URLSearchParams(searchParameters);
//     if (conversationId)
//       nextParameters.set('conversation', conversationId);
//     else
//       nextParameters.delete('conversation');
//     nextParameters.delete('message');
//     setSearchParameters(nextParameters);
//   };

//   /*
//    * SEND MESSAGE
//    */

//   const sendMessage = useSendMessageMutation();

//   const handleSendMessage: SubmitHandler<MessageFormValues> = (values) => {
//     if (!activeConvo)
//       return;

//     sendMessage.mutate(
//       {
//         conversationId: activeConvo,
//         content: values.content,
//       },
//       {
//         onSuccess: () => {
//           messageForm.reset();
//         },
//       },
//     );
//   };

//   /*
//    * WEBSOCKET
//    */

//   useEffect(() => {
//     if (!user)
//       return;

//     const token = tokenStorage.getAccess();
//     if (!token)
//       return;

//     const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

//     const wsUrl
//       = `${base.replace('http://', 'ws://').replace('https://', 'wss://')
//       }/api/v1/me/realtime/stream?token=${encodeURIComponent(token)}`;

//     const socket = new WebSocket(wsUrl);

//     const handleOpen = () => {
//       console.warn('websocket connected');
//     };

//     const handleMessage = () => {
//       queryClient.invalidateQueries({
//         queryKey: conversationsQueryKey.all(),
//       });

//       if (activeConvo) {
//         queryClient.invalidateQueries({
//           queryKey: conversationsQueryKey.messages(activeConvo),
//         });
//       }
//     };

//     const handleError = (error: Event) => {
//       console.error('websocket error', error);
//     };

//     const handleClose = () => {
//       console.warn('websocket disconnected');
//     };

//     socket.addEventListener('open', handleOpen);
//     socket.addEventListener('close', handleClose);
//     socket.addEventListener('message', handleMessage);
//     socket.addEventListener('error', handleError);

//     return () => {
//       socket.removeEventListener('open', handleOpen);
//       socket.removeEventListener('close', handleClose);
//       socket.removeEventListener('message', handleMessage);
//       socket.removeEventListener('error', handleError);
//       socket.close();
//     };
//   }, [user, activeConvo, queryClient]);

//   /*
//    * AUTO SCROLL
//    */

//   useEffect(() => {
//     if (!focusedMessageId)
//       messagesEndReference.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [focusedMessageId, messages]);

//   if (authLoading)
//     return null;

//   const activeConversation = conversations.find(
//     (conversation: Conversation) => conversation.id === activeConvo,
//   );
//   const hasActiveConversation = Boolean(activeConvo && activeConversation);
//   return (
//     <div className="flex min-h-screen flex-col bg-background">
//       <Navbar />

//       <main className="container flex-1 py-6">
//         <h1 className="mb-4 text-2xl font-bold">Messages</h1>

//         <div className="
//           grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-4
//           md:grid-cols-3
//         "
//         >
//           {/* LEFT SIDEBAR */}

//           <Card
//             className={`
//               md:col-span-1
//               ${activeConvo
//       ? `
//         hidden
//         md:block
//       `
//       : ''}
//             `}
//           >
//             <CardContent className="p-0">
//               <ScrollArea className="h-[calc(100vh-280px)] min-h-[440px]">
//                 {convosLoading
//                   ? (
//                       <div className="flex items-center justify-center p-8">
//                         <Loader2 className="h-6 w-6 animate-spin" />
//                       </div>
//                     )
//                   : (conversations.length === 0
//                       ? (
//                           <div className="flex flex-col items-center justify-center p-8 text-center">
//                             <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground" />
//                             <p className="text-sm text-muted-foreground">
//                               No conversations
//                             </p>
//                           </div>
//                         )
//                       : (
//                           conversations.map((conversation: Conversation) => {
//                             const otherName
//                               = conversation.buyerId === user?.id
//                                 ? conversation.sellerFullName
//                                 : conversation.buyerFullName;

//                             return (
//                               <button
//                                 key={conversation.id}
//                                 onClick={() => selectConversation(conversation.id)}
//                                 className={`
//                                   w-full border-b p-3 text-left transition-colors
//                                   hover:bg-accent/50
//                                   ${
//                               activeConvo === conversation.id ? 'bg-accent' : ''
//                               }
//                                 `}
//                               >
//                                 <div className="flex items-center justify-between">
//                                   <p className="truncate text-sm font-medium">
//                                     {otherName}
//                                   </p>

//                                   {conversation.unreadCount > 0 && (
//                                     <Badge className="text-xs">
//                                       {conversation.unreadCount}
//                                     </Badge>
//                                   )}
//                                 </div>

//                                 <p className="mt-1 truncate text-xs text-muted-foreground">
//                                   {getConversationContextLabel(conversation.type, conversation.listingTitle)}
//                                 </p>

//                                 <p className="mt-1 truncate text-xs text-muted-foreground">
//                                   {conversation.lastMessageContent ?? 'No messages'}
//                                 </p>
//                               </button>
//                             );
//                           })
//                         ))}
//               </ScrollArea>
//             </CardContent>
//           </Card>

//           {/* CHAT */}

//           <Card
//             className={`
//               flex flex-col
//               md:col-span-2
//               ${
//     activeConvo
//       ? ''
//       : `
//         hidden
//         md:flex
//       `
//     }
//             `}
//           >
//             {hasActiveConversation
//               ? (
//                   <>
//                     {/* HEADER */}

//                     <div className="flex items-center gap-3 border-b p-3">
//                       <Button
//                         onClick={() => selectConversation(null)}
//                         size="icon"
//                         variant="ghost"
//                         className="md:hidden"
//                       >
//                         <ArrowLeft className="h-4 w-4" />
//                       </Button>

//                       <div>
//                         <p className="text-sm font-medium">
//                           {activeConversation.type === 'DIRECT'
//                             ? (
//                                 <Link
//                                   to={`/seller/${activeConversation.buyerId === user?.id
//                                     ? activeConversation.sellerId
//                                     : activeConversation.buyerId}`}
//                                   className="
//                                     rounded-sm
//                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
//                                   "
//                                 >
//                                   {activeConversation.buyerId === user?.id
//                                     ? activeConversation.sellerFullName
//                                     : activeConversation.buyerFullName}
//                                 </Link>
//                               )
//                             : activeConversation.buyerId === user?.id
//                               ? activeConversation.sellerFullName
//                               : activeConversation.buyerFullName}
//                         </p>

//                         <p className="text-xs text-muted-foreground">
//                           {getConversationContextLabel(activeConversation.type, activeConversation.listingTitle)}
//                         </p>
//                       </div>
//                     </div>

//                     {/* MESSAGE LIST */}

//                     <ScrollArea className="flex-1 p-4">
//                       {msgsLoading
//                         ? (
//                             <div className="flex justify-center p-8">
//                               <Loader2 className="h-6 w-6 animate-spin" />
//                             </div>
//                           )
//                         : (messages.length === 0
//                             ? (
//                                 <p className="py-8 text-center text-sm text-muted-foreground">
//                                   Start conversation
//                                 </p>
//                               )
//                             : (
//                                 <div className="space-y-3">
//                                   {messages.map((message: Message) => {
//                                     const isMine = message.senderId === user?.id;

//                                     return (
//                                       <div
//                                         key={message.id}
//                                         id={`conversation-message-${message.id}`}
//                                         tabIndex={-1}
//                                         className={`
//                                           flex
//                                           ${focusedMessageId === message.id ? 'rounded-lg ring-2 ring-primary ring-offset-2' : ''}
//                                           ${
//                                       isMine ? 'justify-end' : 'justify-start'
//                                       }
//                                         `}
//                                       >
//                                         <div className="max-w-[75%]">
//                                           <div
//                                             className={`
//                                               rounded-2xl px-4 py-2
//                                               ${
//                                       isMine
//                                         ? 'bg-primary text-primary-foreground'
//                                         : 'bg-muted'
//                                       }
//                                             `}
//                                           >
//                                             <p className="whitespace-pre-wrap text-sm">
//                                               {message.content}
//                                             </p>

//                                             <p
//                                               className={`
//                                                 mt-1 text-[10px]
//                                                 ${
//                                       isMine
//                                         ? 'text-primary-foreground/60'
//                                         : 'text-muted-foreground'
//                                       }
//                                               `}
//                                             >
//                                               {format(
//                                                 new Date(message.createdAt),
//                                                 'MMM d, h:mm a',
//                                               )}
//                                             </p>
//                                           </div>

//                                           {message.isFlagged && (
//                                             <p className="mt-1 text-xs text-yellow-500">
//                                               flagged message
//                                             </p>
//                                           )}
//                                         </div>
//                                       </div>
//                                     );
//                                   })}

//                                   <div ref={messagesEndReference} />
//                                 </div>
//                               ))}
//                     </ScrollArea>

//                     {/* INPUT */}

//                     <div className="border-t p-3">
//                       <form
//                         onSubmit={messageForm.handleSubmit(handleSendMessage)}
//                         className="flex gap-2"
//                       >
//                         <Controller
//                           name="content"
//                           control={messageForm.control}
//                           render={({ field }) => (
//                             <Input
//                               placeholder="Type message..."
//                               className="flex-1"
//                               {...field}
//                             />
//                           )}
//                         />

//                         <Button
//                           disabled={!messageContent.trim() || sendMessage.isPending}
//                           size="icon"
//                           type="submit"
//                         >
//                           <Send className="h-4 w-4" />
//                         </Button>
//                       </form>
//                     </div>
//                   </>
//                 )
//               : (
//                   <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
//                     <MessageSquare className="mb-2 h-12 w-12" />
//                     <p>Select a conversation</p>
//                   </div>
//                 )}
//           </Card>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// }

// export default Messages;

import type { SubmitHandler } from 'react-hook-form';
import type { Conversation, Message } from '@/types/conversation.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MessageSquare, Paperclip, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '@/hooks/useConverstion';
import { CHAT_MEDIA_ACCEPT, CHAT_MEDIA_MAX_ATTACHMENTS, getChatMediaValidationError } from '@/lib/chatMedia';
import { getConversationContextLabel } from '@/lib/conversationContext';
import { tokenStorage } from '@/lib/tokenStorage';
import { conversationsQueryKey } from '@/queries/conversation.query';

interface SelectedChatMedia {
  id: number;
  file: File;
}

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

type MessageFormValues = z.infer<typeof messageSchema>;

function Messages() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParameters, setSearchParameters] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeConvo, setActiveConvo] = useState<string | null>(
    searchParameters.get('conversation'),
  );
  const [documentVisible, setDocumentVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [selectedChatMedia, setSelectedChatMedia] = useState<SelectedChatMedia[]>([]);
  const [chatMediaSelectionError, setChatMediaSelectionError] = useState('');

  const markReadInFlight = useRef(new Set<string>());
  const chatMediaPickerReference = useRef<HTMLInputElement>(null);
  const nextChatMediaId = useRef(0);
  const messagesEndReference = useRef<HTMLDivElement>(null);
  const focusedMessageId = searchParameters.get('message');

  const messageForm = useForm<MessageFormValues>({
    defaultValues: { content: '' },
    mode: 'all',
    resolver: zodResolver(messageSchema),
  });
  const messageContent = messageForm.watch('content');

  // AUTH
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // FETCH CONVERSATIONS
  const { data: conversationsResponse, isLoading: convosLoading }
    = useQuery(getConversationsOptions());

  const conversations = useMemo(
    () => conversationsResponse?.data ?? [],
    [conversationsResponse?.data],
  );

  useEffect(() => {
    setActiveConvo(searchParameters.get('conversation'));
  }, [searchParameters]);

  useEffect(() => {
    if (
      convosLoading
      || !activeConvo
      || conversations.some(conversation => conversation.id === activeConvo)
    ) {
      return;
    }

    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.delete('conversation');
    nextParameters.delete('message');
    setActiveConvo(null);
    setSearchParameters(nextParameters, { replace: true });
  }, [
    activeConvo,
    conversations,
    convosLoading,
    searchParameters,
    setSearchParameters,
  ]);

  // FETCH MESSAGES
  const { data: messagesResponse, isLoading: msgsLoading } = useQuery(
    getConversationMessagesOptions(activeConvo || undefined),
  );

  const messages = useMemo(
    () => messagesResponse?.data ?? [],
    [messagesResponse?.data],
  );

  const markConversationRead = useMarkConversationReadMutation();

  // DOCUMENT VISIBILITY
  useEffect(() => {
    const updateDocumentVisibility = () => {
      setDocumentVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', updateDocumentVisibility);
    return () => {
      document.removeEventListener('visibilitychange', updateDocumentVisibility);
    };
  }, []);

  // MARK INCOMING MESSAGES AS READ
  useEffect(() => {
    if (!activeConvo || msgsLoading || !documentVisible || !user) {
      return;
    }

    const hasUnreadIncomingMessage = messages.some(
      message => message.senderId !== user.id && !message.readAt,
    );

    if (
      !hasUnreadIncomingMessage
      || markReadInFlight.current.has(activeConvo)
    ) {
      return;
    }

    markReadInFlight.current.add(activeConvo);
    markConversationRead.mutate(activeConvo, {
      onSettled: () => markReadInFlight.current.delete(activeConvo),
    });
  }, [
    activeConvo,
    documentVisible,
    markConversationRead,
    messages,
    msgsLoading,
    user,
  ]);

  // FOCUS A DEEP-LINKED MESSAGE
  useEffect(() => {
    if (!activeConvo || msgsLoading || !focusedMessageId) {
      return;
    }

    const focusedMessage = messages.find(
      message => message.id === focusedMessageId,
    );

    if (focusedMessage) {
      const element = document.querySelector<HTMLDivElement>(
        `#conversation-message-${CSS.escape(focusedMessage.id)}`,
      );
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.delete('message');
    setSearchParameters(nextParameters, { replace: true });
  }, [
    activeConvo,
    focusedMessageId,
    messages,
    msgsLoading,
    searchParameters,
    setSearchParameters,
  ]);

  const selectConversation = (conversationId: string | null) => {
    setActiveConvo(conversationId);
    const nextParameters = new URLSearchParams(searchParameters);

    if (conversationId) {
      nextParameters.set('conversation', conversationId);
    }
    else {
      nextParameters.delete('conversation');
    }

    nextParameters.delete('message');
    setSearchParameters(nextParameters);
  };

  // SEND MESSAGE
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
        onSuccess: () => messageForm.reset(),
      },
    );
  };

  const addChatMedia = (incomingFiles: File[]) => {
    const validFiles: File[] = [];
    const selectionErrors: string[] = [];

    for (const file of incomingFiles) {
      const validationError = getChatMediaValidationError(file);
      if (validationError) {
        selectionErrors.push(validationError);
      }
      else {
        validFiles.push(file);
      }
    }

    const availableAttachmentCount = CHAT_MEDIA_MAX_ATTACHMENTS - selectedChatMedia.length;
    if (validFiles.length > availableAttachmentCount) {
      selectionErrors.push(`Up to ${CHAT_MEDIA_MAX_ATTACHMENTS} attachments can be selected per message.`);
    }

    setSelectedChatMedia([
      ...selectedChatMedia,
      ...validFiles.slice(0, availableAttachmentCount).map(file => ({
        id: nextChatMediaId.current++,
        file,
      })),
    ]);
    setChatMediaSelectionError(selectionErrors.join(' '));
  };

  const removeChatMedia = (attachmentId: number) => {
    setSelectedChatMedia(selectedChatMedia.filter(({ id }) => id !== attachmentId));
  };

  // WEBSOCKET
  useEffect(() => {
    if (!user)
      return;

    const token = tokenStorage.getAccess();
    if (!token)
      return;

    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    const wsUrl = `${base.replace('http://', 'ws://').replace('https://', 'wss://')}/api/v1/me/realtime/stream?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);

    const handleOpen = () => console.warn('websocket connected');
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
    const handleError = (error: Event) => console.error('websocket error', error);
    const handleClose = () => console.warn('websocket disconnected');

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

  // AUTO SCROLL TO LATEST MESSAGE
  useEffect(() => {
    if (!focusedMessageId) {
      messagesEndReference.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [focusedMessageId, messages]);

  if (authLoading)
    return null;

  const activeConversation = conversations.find(
    (conversation: Conversation) => conversation.id === activeConvo,
  );
  const hasActiveConversation = Boolean(activeConvo && activeConversation);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="
        container flex min-h-0 flex-1 flex-col py-4
        md:py-6
      "
      >
        <h1 className="mb-4 shrink-0 text-2xl font-bold">Messages</h1>

        <div
          className="
            grid min-h-0 flex-1 grid-cols-1 gap-4
            md:h-[calc(100dvh-220px)] md:flex-none md:grid-cols-3
          "
        >
          {/* LEFT SIDEBAR */}
          <Card
            className={`
              min-h-0 overflow-hidden
              md:col-span-1
              ${activeConvo
      ? `
        hidden
        md:block
      `
      : 'block'}
            `}
          >
            <CardContent className="h-full min-h-0 p-0">
              <ScrollArea className="h-full">
                {convosLoading
                  ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )
                  : conversations.length === 0
                    ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No conversations</p>
                        </div>
                      )
                    : (
                        conversations.map((conversation: Conversation) => {
                          const otherName = conversation.buyerId === user?.id
                            ? conversation.sellerFullName
                            : conversation.buyerFullName;

                          return (
                            <button
                              key={conversation.id}
                              onClick={() => selectConversation(conversation.id)}
                              className={`
                                w-full border-b p-3 text-left transition-colors
                                hover:bg-accent/50
                                ${activeConvo === conversation.id ? 'bg-accent' : ''}
                              `}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium">{otherName}</p>
                                {conversation.unreadCount > 0 && (
                                  <Badge className="shrink-0 text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {getConversationContextLabel(conversation.type, conversation.listingTitle)}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {conversation.lastMessageContent ?? 'No messages'}
                              </p>
                            </button>
                          );
                        })
                      )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* CHAT PANEL */}
          <Card
            className={`
              flex h-[calc(100dvh-190px)] min-h-0 flex-col overflow-hidden
              md:col-span-2 md:h-auto
              ${activeConvo
      ? ''
      : `
        hidden
        md:flex
      `}
            `}
          >
            {hasActiveConversation
              ? (
                  <>
                    {/* HEADER stays at the top */}
                    <div className="flex shrink-0 items-center gap-3 border-b p-3">
                      <Button
                        onClick={() => selectConversation(null)}
                        size="icon"
                        variant="ghost"
                        className="md:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {activeConversation.type === 'DIRECT'
                            ? (
                                <Link
                                  to={`/seller/${activeConversation.buyerId === user?.id
                                    ? activeConversation.sellerId
                                    : activeConversation.buyerId}`}
                                  className="
                                    rounded-sm
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                  "
                                >
                                  {activeConversation.buyerId === user?.id
                                    ? activeConversation.sellerFullName
                                    : activeConversation.buyerFullName}
                                </Link>
                              )
                            : activeConversation.buyerId === user?.id
                              ? activeConversation.sellerFullName
                              : activeConversation.buyerFullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {getConversationContextLabel(activeConversation.type, activeConversation.listingTitle)}
                        </p>
                      </div>
                    </div>

                    {/* MESSAGE LIST: only this section scrolls */}
                    <ScrollArea className="min-h-0 flex-1">
                      <div className="space-y-3 p-4">
                        {msgsLoading
                          ? (
                              <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            )
                          : messages.length === 0
                            ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                  Start conversation
                                </p>
                              )
                            : (
                                messages.map((message: Message) => {
                                  const isMine = message.senderId === user?.id;

                                  return (
                                    <div
                                      key={message.id}
                                      id={`conversation-message-${message.id}`}
                                      tabIndex={-1}
                                      className={`
                                        flex min-w-0
                                        ${focusedMessageId === message.id ? 'rounded-lg ring-2 ring-primary ring-offset-2' : ''}
                                        ${isMine ? 'justify-end' : 'justify-start'}
                                      `}
                                    >
                                      <div className="min-w-0 max-w-[75%]">
                                        <div className={`
                                          break-words rounded-2xl px-4 py-2
                                          ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                                        `}
                                        >
                                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                          <p className={`
                                            mt-1 text-[10px]
                                            ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}
                                          `}
                                          >
                                            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                          </p>
                                        </div>
                                        {message.isFlagged && (
                                          <p className="mt-1 text-xs text-yellow-500">flagged message</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                        <div ref={messagesEndReference} />
                      </div>
                    </ScrollArea>

                    {/* INPUT stays pinned to the bottom */}
                    <div className="shrink-0 border-t bg-background p-3">
                      {selectedChatMedia.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {selectedChatMedia.map(({ id, file }) => (
                            <ChatAttachmentPreview
                              key={id}
                              onRemove={() => removeChatMedia(id)}
                              file={file}
                            />
                          ))}
                        </div>
                      )}
                      {chatMediaSelectionError && (
                        <p role="alert" className="mb-2 text-xs text-destructive">
                          {chatMediaSelectionError}
                        </p>
                      )}
                      <form
                        onSubmit={messageForm.handleSubmit(handleSendMessage)}
                        className="flex min-w-0 gap-2"
                      >
                        <input
                          onChange={(event) => {
                            addChatMedia([...(event.target.files ?? [])]);
                            event.target.value = '';
                          }}
                          ref={chatMediaPickerReference}
                          accept={CHAT_MEDIA_ACCEPT}
                          aria-label="Select photos and videos"
                          multiple
                          type="file"
                          className="hidden"
                        />
                        <Button
                          onClick={() => chatMediaPickerReference.current?.click()}
                          aria-label="Attach photo or video"
                          disabled={selectedChatMedia.length >= CHAT_MEDIA_MAX_ATTACHMENTS || sendMessage.isPending}
                          size="icon"
                          type="button"
                          variant="outline"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Controller
                          name="content"
                          control={messageForm.control}
                          render={({ field }) => (
                            <Input
                              placeholder="Type message..."
                              className="min-w-0 flex-1"
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
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-muted-foreground">
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

function ChatAttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border bg-muted">
      {previewUrl && (file.type.startsWith('video/')
        ? <video src={previewUrl} aria-label={`Preview ${file.name}`} className="h-full w-full object-cover" />
        : <img src={previewUrl} alt={`Preview ${file.name}`} className="h-full w-full object-cover" />)}
      <Button
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        size="icon"
        type="button"
        variant="ghost"
        className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-background/90 p-1"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default Messages;
