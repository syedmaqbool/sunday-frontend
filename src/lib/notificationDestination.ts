import type { Notification } from '@/types/notification.type';

export function getNotificationDestinationPath(notification: Notification): string | null {
  const destination = notification.destination;
  if (!destination)
    return null;

  const resourceId = destination.resourceId;
  const parameters = new URLSearchParams();
  const focusedChild = destination.focusedChild;

  if (destination.resource === 'conversation' && destination.section === 'messages') {
    if (resourceId)
      parameters.set('conversation', resourceId);
    if (focusedChild?.resource === 'message')
      parameters.set('message', focusedChild.resourceId);
    return `/messages${parameters.toString() ? `?${parameters.toString()}` : ''}`;
  }

  if (destination.resource === 'supportTicket' && destination.section === 'messages') {
    if (resourceId)
      parameters.set('ticket', resourceId);
    if (focusedChild?.resource === 'supportTicketMessage')
      parameters.set('message', focusedChild.resourceId);
    const path = notification.audience === 'ADMIN' ? '/admin/support' : '/support';
    return `${path}${parameters.toString() ? `?${parameters.toString()}` : ''}`;
  }

  if (destination.resource === 'listing' && destination.section === 'editor') {
    return resourceId ? `/edit-listing/${encodeURIComponent(resourceId)}` : '/my-listings';
  }

  if (destination.resource === 'listing' && destination.section === 'detail') {
    return resourceId ? `/listing/${encodeURIComponent(resourceId)}` : '/listings';
  }

  if (destination.resource === 'listing' && destination.section === 'list') {
    return '/listings';
  }

  if (destination.resource === 'listing' && destination.section === 'moderation') {
    if (resourceId)
      parameters.set('listing', resourceId);
    parameters.set('status', 'PENDING');
    return `/admin/listings?${parameters.toString()}`;
  }

  if (destination.resource === 'offer') {
    const received = destination.section === 'received' || destination.recipient === 'SELLER';
    const sent = destination.section === 'sent' || destination.recipient === 'BUYER';

    if (received) {
      if (resourceId)
        parameters.set('offer', resourceId);
      parameters.set('tab', 'offers');
      return `/my-listings?${parameters.toString()}`;
    }

    if (sent) {
      if (resourceId)
        parameters.set('offer', resourceId);
      return `/my-offers${parameters.toString() ? `?${parameters.toString()}` : ''}`;
    }
  }

  return null;
}
