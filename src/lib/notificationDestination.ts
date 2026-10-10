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

  if (destination.resource === 'supportTicket') {
    if (resourceId)
      parameters.set('ticket', resourceId);
    if (focusedChild?.resource === 'supportTicketMessage')
      parameters.set('message', focusedChild.resourceId);
    const path = notification.audience === 'ADMIN' ? '/admin/support' : '/support';
    return `${path}${parameters.toString() ? `?${parameters.toString()}` : ''}`;
  }

  if (destination.resource === 'listing' && destination.section === 'editor') {
    return resourceId ? `${notification.metadata?.status === 'REJECTED' ? '/my-listings?tab=pending' : '/my-listings?tab=approved'}` : '/my-listings';
  }

  if (destination.resource === 'listing' && destination.section === 'detail') {
    return resourceId ? `/listing/${encodeURIComponent(resourceId)}` : '/listings';
  }

  if (destination.resource === 'listing' && destination.section === 'list') {
    if (notification.audience === 'ADMIN')
      return '/admin/listings';
    return destination.recipient === 'SELLER' ? '/my-listings' : '/listings';
  }

  if (destination.resource === 'complaint') {
    if (notification.audience === 'ADMIN')
      return null;

    parameters.set('tab', 'returns');
    parameters.set('returnsTab', destination.recipient === 'SELLER' || destination.section === 'returned-to-me'
      ? 'returned-to-me'
      : 'my-returns');
    if (resourceId)
      parameters.set('complaint', resourceId);
    return `/profile?${parameters.toString()}`;
  }

  if (destination.resource === 'report') {
    if (notification.audience === 'ADMIN') {
      if (resourceId)
        parameters.set('report', resourceId);
      return `/admin/reports${parameters.toString() ? `?${parameters.toString()}` : ''}`;
    }
    return '/listings';
  }

  if (destination.resource === 'seller') {
    if (!resourceId)
      return '/listings';

    if (destination.section === 'reviews') {
      parameters.set('tab', 'reviews');
      if (focusedChild?.resource === 'review')
        parameters.set('review', focusedChild.resourceId);
      return `/seller/${encodeURIComponent(resourceId)}?${parameters.toString()}`;
    }

    return `/seller/${encodeURIComponent(resourceId)}`;
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

  else if (destination.resource === 'order') {
    const recipient = destination.recipient;
    if (recipient === 'BUYER' || (!recipient && notification.audience === 'USER' && destination.section === 'detail')) {
      return resourceId ? `/order-confirmation/${encodeURIComponent(resourceId)}` : '/profile';
    }
    if (recipient === 'ADMIN' && destination.section === 'manual-payment-review') {
      const paymentSubmissionId = focusedChild?.resource === 'manualPaymentSubmission'
        ? focusedChild.resourceId
        : null;
      if (!resourceId || !paymentSubmissionId)
        return '/admin/orders';
      parameters.set('order', resourceId);
      parameters.set('paymentSubmission', paymentSubmissionId);
      return `/admin/orders?${parameters.toString()}`;
    }
    if (recipient === 'SELLER' || destination.section === 'sold') {
      if (resourceId)
        parameters.set('order', resourceId);
      if (focusedChild?.resource === 'orderItem')
        parameters.set('item', focusedChild.resourceId);
      parameters.set('tab', 'sold');
      return `/profile?${parameters.toString()}`;
    }
    if (recipient === 'ADMIN' || destination.section === 'management') {
      if (resourceId)
        parameters.set('order', resourceId);
      if (focusedChild?.resource === 'orderItem')
        parameters.set('item', focusedChild.resourceId);
      return `/admin/orders${parameters.toString() ? `?${parameters.toString()}` : ''}`;
    }
    return notification.audience === 'ADMIN' ? '/admin/orders' : '/profile';
  }

  return null;
}
