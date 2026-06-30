import type { CommissionTier, CommissionTierPayload } from '@/types/commission.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listCommissionTiers() {
  return authInstance
    .get('/api/v1/admin/settings/commission-tiers')
    .json<PaginatedResponse<CommissionTier>>();
}

export function createCommissionTier(payload: CommissionTierPayload) {
  return authInstance
    .post('/api/v1/admin/settings/commission-tiers', { json: payload })
    .json<Response<CommissionTier>>();
}

export function updateCommissionTier(
  commissionTierId: string,
  payload: Partial<CommissionTierPayload>,
) {
  return authInstance
    .patch(`/api/v1/admin/settings/commission-tiers/${commissionTierId}`, {
      json: payload,
    })
    .json<Response<CommissionTier>>();
}

export function deleteCommissionTier(commissionTierId: string) {
  return authInstance
    .delete(`/api/v1/admin/settings/commission-tiers/${commissionTierId}`)
    .json<Response>();
}
