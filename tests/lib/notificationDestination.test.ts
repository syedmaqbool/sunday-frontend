import type { Notification } from '@/types/notification.type';
import { describe, expect, it } from 'vitest';
import { getNotificationDestinationPath } from '@/lib/notificationDestination';

function notification(destination: Notification['destination'], audience: Notification['audience'] = 'USER') {
  return { audience, destination } as Notification;
}

describe('getNotificationDestinationPath', () => {
  it('opens a user conversation and focuses the notified message', () => {
    expect(getNotificationDestinationPath(notification({
      resourceId: 'conversation-1',
      focusedChild: { resourceId: 'message-1', resource: 'message' },
      resource: 'conversation',
      section: 'messages',
    }))).toBe('/messages?conversation=conversation-1&message=message-1');
  });

  it('opens user and admin support tickets with their message focus', () => {
    const destination = {
      resourceId: 'ticket-1',
      focusedChild: { resourceId: 'message-1', resource: 'supportTicketMessage' },
      resource: 'supportTicket',
      section: 'messages',
    } as const;

    expect(getNotificationDestinationPath(notification(destination))).toBe('/support?ticket=ticket-1&message=message-1');
    expect(getNotificationDestinationPath(notification(destination, 'ADMIN'))).toBe('/admin/support?ticket=ticket-1&message=message-1');
  });

  it('falls back to the relevant list when the target is absent', () => {
    expect(getNotificationDestinationPath(notification({
      resource: 'conversation',
      section: 'messages',
    }))).toBe('/messages');
    expect(getNotificationDestinationPath(notification({
      resource: 'supportTicket',
      section: 'messages',
    }, 'ADMIN'))).toBe('/admin/support');
  });

  it('falls back from a user report with no reported content to listings', () => {
    expect(getNotificationDestinationPath(notification({
      resourceId: 'listing-1',
      resource: 'report',
      section: 'list',
    }))).toBe('/listings');
  });

  it('opens seller listing notifications in the exact listing editor', () => {
    for (const type of [
      'LISTING_APPROVED',
      'LISTING_FEEDBACK_ADDED',
      'LISTING_NEEDS_REVISION',
      'LISTING_REJECTED',
    ] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'listing 1',
          resource: 'listing',
          section: 'editor',
        }),
        type,
      })).toBe('/edit-listing/listing%201');
    }
  });

  it('opens both complaint notification types in the recipient returns tab with the complaint selected', () => {
    for (const type of ['COMPLAINT_RAISED', 'COMPLAINT_UPDATED'] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'complaint 1',
          recipient: 'BUYER',
          resource: 'complaint',
          section: 'my-returns',
        }),
        type,
      })).toBe('/profile?tab=returns&returnsTab=my-returns&complaint=complaint+1');

      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'complaint-2',
          recipient: 'SELLER',
          resource: 'complaint',
          section: 'returned-to-me',
        }),
        type,
      })).toBe('/profile?tab=returns&returnsTab=returned-to-me&complaint=complaint-2');
    }
  });

  it('opens admin report notifications with the report selected and falls back to the list without an id', () => {
    for (const type of ['COMPLAINT_RAISED', 'COMPLAINT_UPDATED'] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'report 1',
          recipient: 'ADMIN',
          resource: 'report',
          section: 'management',
        }, 'ADMIN'),
        type,
      })).toBe('/admin/reports?report=report+1');
    }
    expect(getNotificationDestinationPath(notification({
      recipient: 'ADMIN',
      resource: 'report',
      section: 'list',
    }, 'ADMIN'))).toBe('/admin/reports');
  });

  it('opens user report notifications on the reported listing, conversation message, or seller', () => {
    for (const type of ['COMPLAINT_RAISED', 'COMPLAINT_UPDATED'] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'listing 1',
          resource: 'listing',
          section: 'detail',
        }),
        type,
      })).toBe('/listing/listing%201');
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'conversation-1',
          focusedChild: { resourceId: 'message-1', resource: 'message' },
          resource: 'conversation',
          section: 'messages',
        }),
        type,
      })).toBe('/messages?conversation=conversation-1&message=message-1');
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'seller 1',
          resource: 'seller',
          section: 'listings',
        }),
        type,
      })).toBe('/seller/seller%201');
    }
  });

  it('falls back to the returns or report list when notification targets are missing', () => {
    expect(getNotificationDestinationPath(notification({
      recipient: 'BUYER',
      resource: 'complaint',
      section: 'list',
    }))).toBe('/profile?tab=returns&returnsTab=my-returns');
    expect(getNotificationDestinationPath(notification({
      resource: 'report',
      section: 'list',
    }))).toBe('/listings');
  });

  it('opens admin listing submissions in moderation with URL-backed selection state', () => {
    expect(getNotificationDestinationPath({
      ...notification({
        resourceId: 'listing-1',
        resource: 'listing',
        section: 'moderation',
      }, 'ADMIN'),
      type: 'LISTING_SUBMITTED',
    })).toBe('/admin/listings?listing=listing-1&status=PENDING');
  });

  it('opens the reservation listing for both participants for every reservation notification', () => {
    for (const type of ['RESERVATION_CREATED', 'RESERVATION_EXPIRED', 'RESERVATION_CANCELLED'] as const) {
      for (const recipient of ['BUYER', 'SELLER'] as const) {
        expect(getNotificationDestinationPath({
          ...notification({
            resourceId: 'listing 1',
            recipient,
            resource: 'listing',
            section: 'detail',
          }),
          type,
        })).toBe('/listing/listing%201');
      }
    }
  });

  it('falls back to the listings page when a reservation listing identifier is missing', () => {
    expect(getNotificationDestinationPath(notification({
      recipient: 'BUYER',
      resource: 'listing',
      section: 'list',
    }))).toBe('/listings');
  });

  it('falls back to the seller listing list when the listing editor target is missing', () => {
    expect(getNotificationDestinationPath(notification({
      resource: 'listing',
      section: 'editor',
    }))).toBe('/my-listings');
  });

  it('opens seller notifications in received offers with the exact offer selected', () => {
    for (const type of ['OFFER_CREATED', 'OFFER_WITHDRAWN'] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'offer 1',
          recipient: 'SELLER',
          resource: 'offer',
          section: 'received',
        }),
        type,
      })).toBe('/my-listings?offer=offer+1&tab=offers');
    }
  });

  it('opens buyer notifications in sent offers with the exact offer selected', () => {
    for (const type of [
      'OFFER_ACCEPTED',
      'OFFER_REJECTED',
      'OFFER_COUNTERED',
      'OFFER_EXPIRED',
    ] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'offer-1',
          recipient: 'BUYER',
          resource: 'offer',
          section: 'sent',
        }),
        type,
      })).toBe('/my-offers?offer=offer-1');
    }
  });

  it('routes all order notification types to the recipient-specific order view', () => {
    const sections = {
      ADMIN: 'management',
      BUYER: 'detail',
      SELLER: 'sold',
    } as const;

    for (const type of ['ORDER_CREATED', 'ORDER_ITEM_SHIPPED', 'ORDER_ITEM_DELIVERED'] as const) {
      for (const recipient of ['BUYER', 'SELLER', 'ADMIN'] as const) {
        const audience = recipient === 'ADMIN' ? 'ADMIN' : 'USER';
        const destination = {
          resourceId: 'order-1',
          focusedChild: { resourceId: 'item-1', resource: 'orderItem' },
          recipient,
          resource: 'order',
          section: sections[recipient],
        } as const;
        const path = recipient === 'BUYER'
          ? '/order-confirmation/order-1'
          : (recipient === 'SELLER'
              ? '/profile?order=order-1&item=item-1&tab=sold'
              : '/admin/orders?order=order-1&item=item-1');

        expect(getNotificationDestinationPath({
          ...notification(destination, audience),
          type,
        })).toBe(path);
      }
    }
  });

  it('falls back to each recipient order list when an order identifier is missing', () => {
    expect(getNotificationDestinationPath(notification({
      recipient: 'BUYER',
      resource: 'order',
      section: 'detail',
    }))).toBe('/profile');
    expect(getNotificationDestinationPath(notification({
      recipient: 'SELLER',
      resource: 'order',
      section: 'sold',
    }))).toBe('/profile?tab=sold');
    expect(getNotificationDestinationPath(notification({
      recipient: 'ADMIN',
      resource: 'order',
      section: 'management',
    }, 'ADMIN'))).toBe('/admin/orders');
  });

  it('opens buyer payment notifications at the identified order', () => {
    for (const type of [
      'PAYMENT_REFUNDED',
      'MANUAL_PAYMENT_APPROVED',
      'MANUAL_PAYMENT_REJECTED',
      'MANUAL_PAYMENT_RESUBMISSION_REQUESTED',
      'MANUAL_PAYMENT_CANCELLED',
      'MANUAL_PAYMENT_EXPIRED',
    ] as const) {
      expect(getNotificationDestinationPath({
        ...notification({
          resourceId: 'order-1',
          recipient: 'BUYER',
          resource: 'order',
          section: 'detail',
        }),
        type,
      })).toBe('/order-confirmation/order-1');
    }
  });

  it('opens admin manual payment submissions at the exact order review', () => {
    expect(getNotificationDestinationPath({
      ...notification({
        resourceId: 'order-1',
        focusedChild: { resourceId: 'submission-1', resource: 'manualPaymentSubmission' },
        recipient: 'ADMIN',
        resource: 'order',
        section: 'manual-payment-review',
      }, 'ADMIN'),
      type: 'MANUAL_PAYMENT_SUBMITTED',
    })).toBe('/admin/orders?order=order-1&paymentSubmission=submission-1');
  });

  it('does not route payment notifications without a supported destination', () => {
    expect(getNotificationDestinationPath({
      ...notification(null),
      type: 'PAYMENT_REFUND_REQUIRED',
    })).toBeNull();
  });

  it('opens the appropriate offer list when an older notification has no offer identifier', () => {
    expect(getNotificationDestinationPath(notification({
      recipient: 'SELLER',
      resource: 'offer',
      section: 'received',
    }))).toBe('/my-listings?tab=offers');
    expect(getNotificationDestinationPath(notification({
      recipient: 'BUYER',
      resource: 'offer',
      section: 'sent',
    }))).toBe('/my-offers');
  });
});
