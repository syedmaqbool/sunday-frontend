import type { AdminFlaggedBuyerRuleUpdate } from '@/types/adminFlaggedBuyer.type';
import type { GetAdminFlaggedBuyerRulesResponses, UpdateAdminFlaggedBuyerRulesResponses } from '@/types/generated-api';
import { authInstance } from '@/services/ky.instance';

export function getAdminFlaggedBuyerRules() {
  return authInstance
    .get('/api/v1/admin/flagged-buyers/rules')
    .json<GetAdminFlaggedBuyerRulesResponses['200']>();
}

export function updateAdminFlaggedBuyerRules(rule: AdminFlaggedBuyerRuleUpdate) {
  return authInstance
    .patch('/api/v1/admin/flagged-buyers/rules', { json: rule })
    .json<UpdateAdminFlaggedBuyerRulesResponses['200']>();
}
