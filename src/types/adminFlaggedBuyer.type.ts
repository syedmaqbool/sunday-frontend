import type {
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
