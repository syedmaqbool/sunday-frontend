import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HTTPError } from 'ky';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CategoryManagement from '@/pages/admin/CategoryManagement';

const {
  createClothingTypeMock,
  deleteClothingTypeMock,
  listClothingTypesMock,
  updateClothingTypeMock,
  toastMock,
} = vi.hoisted(() => ({
  createClothingTypeMock: vi.fn(),
  deleteClothingTypeMock: vi.fn(),
  listClothingTypesMock: vi.fn(),
  updateClothingTypeMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

vi.mock('@/services/adminCategoryManagement.service', () => ({
  createCategory: vi.fn(),
  createClothingType: createClothingTypeMock,
  createSubcategory: vi.fn(),
  deleteCategory: vi.fn(),
  deleteClothingType: deleteClothingTypeMock,
  deleteSubcategory: vi.fn(),
  listCategories: vi.fn().mockResolvedValue({ data: [] }),
  listClothingTypes: listClothingTypesMock,
  listSubcategories: vi.fn().mockResolvedValue({ data: [] }),
  updateCategory: vi.fn(),
  updateClothingType: updateClothingTypeMock,
  updateSubcategory: vi.fn(),
}));

function buildClothingType(overrides: Partial<{
  id: string;
  active: boolean;
  label: string;
  sortOrder: number;
  value: string;
}> = {}) {
  return {
    id: 'type-1',
    active: true,
    label: 'Tops',
    sortOrder: 0,
    value: 'tops',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function page(data: ReturnType<typeof buildClothingType>[], currentPage: number, lastPage: number) {
  return {
    data,
    message: 'Clothing types retrieved',
    pagination: {
      currentPage,
      lastPage,
      nextPage: currentPage < lastPage ? currentPage + 1 : null,
      perPage: data.length,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
      total: 3,
    },
    statusCode: 200,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryManagement />
    </QueryClientProvider>,
  );
}

describe('admin clothing type manager', () => {
  beforeEach(() => {
    listClothingTypesMock.mockReset().mockImplementation(({ page: pageNumber }: { page: number }) => {
      if (pageNumber === 1) {
        return Promise.resolve(page([
          buildClothingType({ id: 'type-3', active: false, label: 'Dresses', sortOrder: 2, value: 'dresses' }),
          buildClothingType({ id: 'type-1', label: 'Tops', sortOrder: 0, value: 'tops' }),
        ], 1, 2));
      }

      return Promise.resolve(page([
        buildClothingType({ id: 'type-2', label: 'Bottoms', sortOrder: 1, value: 'bottoms' }),
      ], 2, 2));
    });
    createClothingTypeMock.mockReset().mockResolvedValue({});
    updateClothingTypeMock.mockReset().mockResolvedValue({});
    deleteClothingTypeMock.mockReset().mockResolvedValue({});
  });

  afterEach(cleanup);

  it('shows every admin clothing type in sort order across all catalog pages', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Clothing types (shown when type is Clothes)' })).toBeInTheDocument();
    const clothingTypeLabels = await screen.findAllByRole('textbox', { name: /Clothing type label/ });

    expect(clothingTypeLabels.map(input => (input as HTMLInputElement).value)).toEqual([
      'Tops',
      'Bottoms',
      'Dresses',
    ]);
    await waitFor(() => expect(listClothingTypesMock).toHaveBeenCalledTimes(2));
    expect(listClothingTypesMock).toHaveBeenCalledWith({ page: 1, size: 100 });
    expect(listClothingTypesMock).toHaveBeenCalledWith({ page: 2, size: 100 });
  });

  it('creates a clothing type from its label and refreshes the catalog', async () => {
    renderPage();
    await screen.findByRole('textbox', { name: 'Clothing type label Tops' });
    const initialListCalls = listClothingTypesMock.mock.calls.length;
    const labelInput = screen.getByRole('textbox', { name: 'New clothing type' });
    fireEvent.change(labelInput, { target: { value: '  Shoes  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(createClothingTypeMock).toHaveBeenCalledWith({ label: 'Shoes' }));
    await waitFor(() => expect(listClothingTypesMock.mock.calls.length).toBeGreaterThan(initialListCalls));
  });

  it('updates a clothing type label and sort order without sending a value', async () => {
    renderPage();
    await screen.findByRole('textbox', { name: 'Clothing type label Tops' });
    const labelInput = screen.getByRole('textbox', { name: 'Clothing type label Tops' });
    fireEvent.change(labelInput, { target: { value: 'Tees' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Sort order for Tops' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Tops' }));

    await waitFor(() => expect(updateClothingTypeMock).toHaveBeenCalledWith('type-1', {
      label: 'Tees',
      sortOrder: 4,
    }));
  });

  it('deletes a clothing type', async () => {
    renderPage();
    await screen.findByRole('textbox', { name: 'Clothing type label Tops' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Tops' }));

    await waitFor(() => expect(deleteClothingTypeMock).toHaveBeenCalledWith('type-1'));
  });

  it('keeps a referenced type visible and shows the API error when deletion fails', async () => {
    const apiError = new HTTPError(
      Response.json({ message: 'A listing still references this clothing type.' }, {
        status: 409,
        statusText: 'Conflict',
      }),
      new Request('https://sunday.example/api/v1/admin/clothing-types/type-1', { method: 'DELETE' }),
      {} as never,
    );
    deleteClothingTypeMock.mockRejectedValue(apiError);
    renderPage();
    await screen.findByRole('textbox', { name: 'Clothing type label Tops' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Tops' }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      description: 'A listing still references this clothing type.',
      variant: 'destructive',
    })));
    expect(screen.getByRole('textbox', { name: 'Clothing type label Tops' })).toBeInTheDocument();
  });
});
