import { describe, expect, it, vi } from 'vite-plus/test';
import { getSubcategoriesOptions } from '@/queries/categories.query';
import { getAdminClothingTypesOptions } from '@/queries/categoryManagement.query';
import { getClothingTypesOptions } from '@/queries/clothing-types.query';

const { listAdminClothingTypesMock, listClothingTypesMock, subcategoryGetMock } = vi.hoisted(
  () => ({
    listAdminClothingTypesMock: vi.fn(),
    listClothingTypesMock: vi.fn(),
    subcategoryGetMock: vi.fn(),
  }),
);

vi.mock('@/services/adminCategoryManagement.service', () => ({
  createCategory: vi.fn(),
  createClothingType: vi.fn(),
  createSubcategory: vi.fn(),
  deleteCategory: vi.fn(),
  deleteClothingType: vi.fn(),
  deleteSubcategory: vi.fn(),
  listCategories: vi.fn(),
  listClothingTypes: listAdminClothingTypesMock,
  listSubcategories: vi.fn(),
  updateCategory: vi.fn(),
  updateClothingType: vi.fn(),
  updateSubcategory: vi.fn(),
}));

vi.mock('@/services/clothing-type.service', () => ({
  listClothingTypes: listClothingTypesMock,
}));

vi.mock('@/services/ky.instance', () => ({
  authInstance: { get: subcategoryGetMock },
}));

function page(data: unknown[], currentPage: number, lastPage: number) {
  return {
    data,
    message: 'Catalog page',
    pagination: {
      currentPage,
      lastPage,
      nextPage: currentPage < lastPage ? currentPage + 1 : null,
      perPage: 100,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
      total: 2,
    },
    statusCode: 200,
  };
}

describe('paginated category and clothing type queries', () => {
  it('keeps every public clothing type page intact', async () => {
    const firstPage = page([{ id: 'type-one', label: 'Tops', value: 'tops' }], 1, 2);
    const secondPage = page([{ id: 'type-two', label: 'Dresses', value: 'dresses' }], 2, 2);
    listClothingTypesMock
      .mockReset()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const queryResult = await getClothingTypesOptions().queryFn!({} as never);

    expect(queryResult).toEqual([firstPage, secondPage]);
    expect(queryResult).toHaveLength(2);
    expect(listClothingTypesMock).toHaveBeenCalledTimes(2);
  });

  it('keeps every admin clothing type page intact', async () => {
    const firstPage = page([{ id: 'type-one', label: 'Tops', value: 'tops' }], 1, 2);
    const secondPage = page([{ id: 'type-two', label: 'Dresses', value: 'dresses' }], 2, 2);
    listAdminClothingTypesMock
      .mockReset()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const queryResult = await getAdminClothingTypesOptions().queryFn!({} as never);

    expect(queryResult).toEqual([firstPage, secondPage]);
    expect(listAdminClothingTypesMock).toHaveBeenCalledWith({ page: 1, size: 100 });
    expect(listAdminClothingTypesMock).toHaveBeenCalledWith({ page: 2, size: 100 });
  });

  it('keeps every subcategory page intact', async () => {
    const firstPage = page([{ id: 'subcategory-one', label: 'Clothes', value: 'clothes' }], 1, 2);
    const secondPage = page([{ id: 'subcategory-two', label: 'Shoes', value: 'shoes' }], 2, 2);
    const responses = [firstPage, secondPage];
    subcategoryGetMock.mockReset().mockImplementation(() => ({
      json: vi.fn().mockResolvedValue(responses.shift()),
    }));

    const queryResult = await getSubcategoriesOptions('category-one').queryFn!({} as never);

    expect(queryResult).toEqual([firstPage, secondPage]);
    expect(subcategoryGetMock).toHaveBeenCalledTimes(2);
  });
});
