import { queryOptions } from '@tanstack/react-query';
import { listMyListings } from '@/services/listing.service';

export type MyListing = Awaited<
  ReturnType<typeof listMyListings>
>['data'][number];

export const myListingsQueryKey = {
  list: () => ['my-listings'] as const,
};

export function getMyListingsOptions(enabled = true) {
  return queryOptions({
    enabled,
    queryFn: async () => {
      const response = await listMyListings({ page: 1, size: 100 });

      return response.data;
    },
    queryKey: myListingsQueryKey.list(),
  });
}
