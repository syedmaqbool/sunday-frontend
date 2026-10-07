import type { AdminFlaggedBuyerComplaintHistoryParameters, AdminFlaggedBuyerRuleUpdate, AdminFlaggedBuyersParameters } from '@/types/adminFlaggedBuyer.type';
import type { GetAdminFlaggedBuyerComplaintHistoryResponses, GetAdminFlaggedBuyerRulesResponses, GetAdminFlaggedBuyersResponses, UpdateAdminFlaggedBuyerRulesResponses } from '@/types/generated-api';
import { authInstance } from '@/services/ky.instance';

export function getAdminFlaggedBuyers(parameters: AdminFlaggedBuyersParameters) {
  return authInstance
    .get('/api/v1/admin/flagged-buyers', { searchParams: parameters })
    .json<GetAdminFlaggedBuyersResponses['200']>();
}

export function getAdminFlaggedBuyerRules() {
  return authInstance
    .get('/api/v1/admin/flagged-buyers/rules')
    .json<GetAdminFlaggedBuyerRulesResponses['200']>();
}

export function getAdminFlaggedBuyerComplaintHistory(buyerId: string, parameters: AdminFlaggedBuyerComplaintHistoryParameters) {
  return authInstance
    .get(`/api/v1/admin/flagged-buyers/${buyerId}/history`, { searchParams: parameters })
    .json<GetAdminFlaggedBuyerComplaintHistoryResponses['200']>();
}

export function updateAdminFlaggedBuyerRules(rule: AdminFlaggedBuyerRuleUpdate) {
  return authInstance
    .patch('/api/v1/admin/flagged-buyers/rules', { json: rule })
    .json<UpdateAdminFlaggedBuyerRulesResponses['200']>();
}
