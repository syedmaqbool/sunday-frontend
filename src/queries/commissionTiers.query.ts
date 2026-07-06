import { queryOptions } from '@tanstack/react-query';
import { listPublicCommissionTiers } from '@/services/commission.service';

export const commissionTiersQueryKey = {
  all: () => ['commission-tiers'] as const,
  list: (options?: { onlyActive?: boolean }) =>
    [...commissionTiersQueryKey.all(), 'list', options?.onlyActive ?? false] as const,
};

export function getCommissionTiersOptions(options?: { onlyActive?: boolean }) {
  return queryOptions({
    queryFn: async () => await listPublicCommissionTiers(),
    queryKey: commissionTiersQueryKey.list(options),
    staleTime: 60_000,
  });
}
