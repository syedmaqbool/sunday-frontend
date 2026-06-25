import { useQuery } from '@tanstack/react-query';
import { getActiveTaxOptions } from '@/queries/useActiveTax';

export type { ActiveTax } from '@/queries/useActiveTax';

export function useActiveTax() {
  return useQuery(getActiveTaxOptions());
}
