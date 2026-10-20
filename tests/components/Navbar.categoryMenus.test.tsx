import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '@/components/Navbar';

const {
  getCategoriesOptionsMock,
  getSubcategoriesOptionsMock,
  getClothingTypesOptionsMock,
  subcategoryQueryFns,
  clothingTypesQueryFn,
} = vi.hoisted(() => ({
  getCategoriesOptionsMock: vi.fn(),
  getSubcategoriesOptionsMock: vi.fn(),
  getClothingTypesOptionsMock: vi.fn(),
  subcategoryQueryFns: new Map<string, ReturnType<typeof vi.fn>>(),
  clothingTypesQueryFn: vi.fn(),
}));

vi.mock('@/hooks/useCategories', () => ({
  getCategoriesOptions: getCategoriesOptionsMock,
}));
vi.mock('@/queries/categories.query', () => ({
  getSubcategoriesOptions: getSubcategoriesOptionsMock,
}));
vi.mock('@/queries/clothing-types.query', () => ({
  getClothingTypesOptions: getClothingTypesOptionsMock,
}));
vi.mock('@/queries/siteSettings.query', () => ({
  getPublicHeroImageOptions: () => ({ queryFn: async () => null, queryKey: ['hero'] }),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signOut: vi.fn(), user: null }),
}));
vi.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({ canAccessAdminPortal: false }),
}));
vi.mock('@/components/CartDrawer', () => ({ default: () => null }));
vi.mock('@/components/NotificationBell', () => ({ default: () => null }));

const categories = [
  { id: 'clothes-category', icon: '👕', label: 'Apparel', sortOrder: 1, value: 'apparel' },
  { id: 'home-category', icon: '🏠', label: 'Home Goods', sortOrder: 2, value: 'home-goods' },
];

const subcategoriesByCategory = {
  'clothes-category': [
    { id: 'clothes', icon: '👕', label: 'Clothes', sortOrder: 1, value: 'clothes' },
    { id: 'shoes', icon: '👟', label: 'Footwear', sortOrder: 2, value: 'shoes' },
  ],
  'home-category': [
    { id: 'decor', icon: '🪴', label: 'Decor', sortOrder: 1, value: 'decor' },
  ],
};

const clothingTypes = [
  { id: 'tops', label: 'Tops', sortOrder: 1, value: 'tops' },
  { id: 'bottoms', label: 'Bottoms', sortOrder: 2, value: 'bottoms' },
];

function renderNavbar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Navbar category menus', () => {
  beforeEach(() => {
    subcategoryQueryFns.clear();
    clothingTypesQueryFn.mockClear();
    clothingTypesQueryFn.mockResolvedValue(clothingTypes);
    getCategoriesOptionsMock.mockReturnValue({
      queryFn: async () => categories,
      queryKey: ['categories'],
    });
    getSubcategoriesOptionsMock.mockImplementation((categoryId: keyof typeof subcategoriesByCategory) => {
      let queryFn = subcategoryQueryFns.get(categoryId);
      if (!queryFn) {
        queryFn = vi.fn(async () => subcategoriesByCategory[categoryId]);
        subcategoryQueryFns.set(categoryId, queryFn);
      }
      return {
        queryFn,
        queryKey: ['subcategories', categoryId],
      };
    });
    getClothingTypesOptionsMock.mockReturnValue({
      queryFn: clothingTypesQueryFn,
      queryKey: ['clothing-types'],
    });
  });

  it('shows each category with only its related subcategories and matching browse destinations', async () => {
    renderNavbar();

    const apparel = await screen.findByRole('button', { name: 'Apparel' });
    fireEvent.click(apparel);

    expect(await screen.findByRole('link', { name: 'Browse Apparel' })).toHaveAttribute('href', '/listings?parent=apparel');
    expect(screen.getByRole('link', { name: 'Clothes' })).toHaveAttribute('href', '/listings?category=apparel-clothes');
    expect(screen.getByRole('link', { name: 'Footwear' })).toHaveAttribute('href', '/listings?category=apparel-shoes');
    expect(screen.queryByRole('link', { name: 'Decor' })).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Home Goods' }));
    expect(await screen.findByRole('link', { name: 'Decor' })).toHaveAttribute('href', '/listings?category=home-goods-decor');
    expect(screen.queryByRole('link', { name: 'Footwear' })).not.toBeInTheDocument();
  });

  it('links active clothing types under the Clothes subcategory using the Listings URL contract', async () => {
    renderNavbar();
    fireEvent.click(await screen.findByRole('button', { name: 'Apparel' }));

    expect(await screen.findByRole('link', { name: 'Tops' })).toHaveAttribute('href', '/listings?category=apparel-clothes&clothing_type=tops');
    expect(screen.getByRole('link', { name: 'Bottoms' })).toHaveAttribute('href', '/listings?category=apparel-clothes&clothing_type=bottoms');
  });

  it('opens category menus on keyboard focus and keeps mobile category links available', async () => {
    renderNavbar();

    const apparel = await screen.findByRole('button', { name: 'Apparel' });
    act(() => apparel.focus());
    expect(apparel).toHaveFocus();
    expect(await screen.findByRole('link', { name: 'Browse Apparel' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('link', { name: 'Browse All' })).toHaveAttribute('href', '/listings');
    expect(screen.getByRole('link', { name: 'Apparel' })).toHaveAttribute('href', '/listings?parent=apparel');
  });

  it('loads subcategories once for each resolved category and uses the shared clothing-type query', async () => {
    renderNavbar();

    await waitFor(() => {
      expect(subcategoryQueryFns.get('clothes-category')).toHaveBeenCalledTimes(1);
      expect(subcategoryQueryFns.get('home-category')).toHaveBeenCalledTimes(1);
      expect(clothingTypesQueryFn).toHaveBeenCalledTimes(1);
    });
    expect(getSubcategoriesOptionsMock.mock.calls.map(([categoryId]) => categoryId)).toEqual(
      expect.arrayContaining(['clothes-category', 'home-category']),
    );
    expect(getClothingTypesOptionsMock).toHaveBeenCalled();
  });
});
