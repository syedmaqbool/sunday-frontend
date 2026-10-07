import type {
  GetAdminFlaggedBuyerRulesResponses,
  UpdateAdminFlaggedBuyerRulesData,
} from '@/types/generated-api';

export type AdminFlaggedBuyerRule = GetAdminFlaggedBuyerRulesResponses['200']['data'];
export type AdminFlaggedBuyerRuleUpdate = UpdateAdminFlaggedBuyerRulesData['body'];
