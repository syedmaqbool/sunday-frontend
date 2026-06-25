import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMockDataEnabled } from '@/lib/mockConfig';

export interface Category {
  id: string;
  icon: string;
  label: string;
  sort_order: number;
  value: string;
}
export type Subcategory = Category;

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'mock-cat-1',
    icon: '👗',
    label: 'Women',
    sort_order: 1,
    value: 'women',
  },
  { id: 'mock-cat-2', icon: '👔', label: 'Men', sort_order: 2, value: 'men' },
  {
    id: 'mock-cat-3',
    icon: '🧸',
    label: 'Children',
    sort_order: 3,
    value: 'children',
  },
];

const MOCK_SUBCATEGORIES: Subcategory[] = [
  { id: 'mock-sub-1', icon: '👕', label: 'Tops', sort_order: 1, value: 'tops' },
  {
    id: 'mock-sub-2',
    icon: '👖',
    label: 'Bottoms',
    sort_order: 2,
    value: 'bottoms',
  },
  {
    id: 'mock-sub-3',
    icon: '👗',
    label: 'Dresses',
    sort_order: 3,
    value: 'dresses',
  },
  {
    id: 'mock-sub-4',
    icon: '👟',
    label: 'Shoes',
    sort_order: 4,
    value: 'shoes',
  },
  {
    id: 'mock-sub-5',
    icon: '🧥',
    label: 'Jackets',
    sort_order: 5,
    value: 'jackets',
  },
];

export function useCategories() {
  return useQuery<Category[]>({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_CATEGORIES;
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (error)
        throw error;
      return data as Category[];
    },
    queryKey: ['categories'],
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubcategories() {
  return useQuery<Subcategory[]>({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_SUBCATEGORIES;
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order');
      if (error)
        throw error;
      return data as Subcategory[];
    },
    queryKey: ['subcategories'],
    staleTime: 5 * 60 * 1000,
  });
}
