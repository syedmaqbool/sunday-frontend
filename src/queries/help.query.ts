import type { HelpCategoryAPI, HelpFaqAPI } from '@/types/adminSettings.type';
import type { Response } from '@/types/response.type';
import { queryOptions } from '@tanstack/react-query';
import { authInstance } from '@/services/ky.instance';

export type HelpCategory = HelpCategoryAPI;
export type HelpFaq = HelpFaqAPI;

export const helpQueryKey = {
  all: () => ['help'] as const,
  categories: () => [...helpQueryKey.all(), 'categories'] as const,
  faqs: (categoryKey?: string) =>
    [...helpQueryKey.all(), 'faqs', categoryKey ?? null] as const,
  topFaqs: () => [...helpQueryKey.all(), 'top-faqs'] as const,
};

export function getHelpCategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await authInstance
        .get('api/v1/help-categories')
        .json<Response<HelpCategoryAPI[]>>();
      return response.data;
    },
    queryKey: helpQueryKey.categories(),
  });
}

export function getHelpFaqsOptions(categoryKey?: string) {
  return queryOptions({
    queryFn: async () => {
      const response = await authInstance
        .get('api/v1/help-faqs', {
          searchParams: categoryKey ? { categoryKey } : undefined,
        })
        .json<Response<HelpFaqAPI[]>>();
      return response.data;
    },
    queryKey: helpQueryKey.faqs(categoryKey),
  });
}

export function getTopFaqsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await authInstance
        .get('api/v1/help-faqs/top')
        .json<Response<HelpFaqAPI[]>>();
      return response.data;
    },
    queryKey: helpQueryKey.topFaqs(),
  });
}
