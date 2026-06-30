import { useQuery } from '@tanstack/react-query';
import type { Notification } from '@/types/notification.type';

import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utilities';
import {
  getNotificationsOptions,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/queries/notification.query';

interface NotificationBellProps {
  audience?: 'admin' | 'user';
  className?: string;
}

function NotificationBell({ audience, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery(getNotificationsOptions());

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();

  const items: Notification[] = (data?.data ?? []).filter(
    notification =>
      !audience || notification.audience === audience.toUpperCase(),
  );

  const unread = items.filter(n => !n.readAt).length;

  const markRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    }
    catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllMutation.mutateAsync();
    }
    catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const onClickItem = async (n: Notification) => {
    if (!n.readAt) {
      await markRead(n.id);
    }

    // navigation intentionally removed
    // backend currently does not provide link field

    setOpen(false);
  };

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Notifications"
          size="icon"
          variant="ghost"
          className={cn(
            `
              relative text-muted-foreground
              hover:text-foreground
            `,
            className,
          )}
        >
          <Bell className="h-5 w-5" />

          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
            >
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>

          {unread > 0 && (
            <Button
              onClick={markAllRead}
              disabled={markAllMutation.isPending}
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
            >
              {markAllMutation.isPending
                ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )
                : (
                    <>
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </>
                  )}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {isLoading
            ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )
            : (items.length === 0
                ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </p>
                  )
                : (
                    <ul className="divide-y divide-border">
                      {items.map(n => (
                        <li key={n.id}>
                          <button
                            onClick={() => onClickItem(n)}
                            type="button"
                            className={cn(
                              `
                                flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors
                                hover:bg-muted/60
                              `,
                              !n.readAt && 'bg-primary/5',
                            )}
                          >
                            <div className="flex w-full items-start gap-2">
                              {!n.readAt && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {n.title}
                                </p>

                                {n.body && (
                                  <p className="line-clamp-2 text-xs text-muted-foreground">
                                    {n.body}
                                  </p>
                                )}

                                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {formatDistanceToNow(new Date(n.createdAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
