import type {
  GetAdminFlaggedBuyerComplaintHistoryData,
  GetAdminFlaggedBuyerComplaintHistoryResponses,
  GetAdminFlaggedBuyerRulesResponses,
  GetAdminFlaggedBuyersData,
  GetAdminFlaggedBuyersResponses,
  UpdateAdminFlaggedBuyerRulesData,
} from '@/types/generated-api';

export type AdminFlaggedBuyer = GetAdminFlaggedBuyersResponses['200']['data'][number];
export type AdminFlaggedBuyersResponse = GetAdminFlaggedBuyersResponses['200'];
export type AdminFlaggedBuyersParameters = GetAdminFlaggedBuyersData['query'];
export type AdminFlaggedBuyerRule = GetAdminFlaggedBuyerRulesResponses['200']['data'];
export type AdminFlaggedBuyerRuleUpdate = UpdateAdminFlaggedBuyerRulesData['body'];
export type AdminFlaggedBuyerComplaintHistory = GetAdminFlaggedBuyerComplaintHistoryResponses['200']['data'][number];
export type AdminFlaggedBuyerComplaintHistoryResponse = GetAdminFlaggedBuyerComplaintHistoryResponses['200'];
export type AdminFlaggedBuyerComplaintHistoryParameters = GetAdminFlaggedBuyerComplaintHistoryData['query'];
