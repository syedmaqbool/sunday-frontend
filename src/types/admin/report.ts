export type ReportStatus = "OPEN" | "DISMISSED" | "RESOLVED";

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  listingId: string | null;
  conversationId: string | null;
  messageId: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporterFullName: string;
  reportedUserFullName: string | null;
  listingTitle: string | null;
  messageContent: string | null;
  resolverFullName: string | null;
}

export interface ResolveReportPayload {
  status: "DISMISSED" | "RESOLVED";
  adminNotes?: string;
}
