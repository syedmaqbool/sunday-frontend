export type ReportStatus = 'DISMISSED' | 'OPEN' | 'RESOLVED';

export interface AdminReport {
  id: string;
  conversationId: string | null;
  listingId: string | null;
  messageId: string | null;
  reportedUserId: string | null;
  reporterId: string;
  adminNotes: string | null;
  details: string | null;
  listingTitle: string | null;
  messageContent: string | null;
  reason: string;
  reportedUserFullName: string | null;
  reporterFullName: string;
  resolverFullName: string | null;
  status: ReportStatus;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolveReportPayload {
  adminNotes?: string;
  status: 'DISMISSED' | 'RESOLVED';
}
