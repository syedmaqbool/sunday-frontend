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

  it('does not route unsupported destinations', () => {
    expect(getNotificationDestinationPath(notification({
      resourceId: 'listing-1',
      resource: 'listing',
      section: 'detail',
    }))).toBeNull();
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

  it('falls back to the seller listing list when the listing editor target is missing', () => {
    expect(getNotificationDestinationPath(notification({
      resource: 'listing',
      section: 'editor',
    }))).toBe('/my-listings');
  });
});
