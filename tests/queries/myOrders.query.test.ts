import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMySalesOrderOptions, myOrdersQueryKey } from '@/queries/myOrders.query';

const listSalesMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/myOrders.service', () => ({
  getOrder: vi.fn(),
  listOrders: vi.fn(),
  listSales: listSalesMock,
  updateItemStatus: vi.fn(),
}));

describe('my sales order query', () => {
  beforeEach(() => {
    listSalesMock.mockReset();
  });

  it('searches later pages for the selected seller order item', async () => {
    const firstPage = {
      data: [{ id: 'recent-item', orderId: 'recent-order' }],
      pagination: { currentPage: 1, lastPage: 2 },
    };
    const matchingPage = {
      data: [{ id: 'selected-item', orderId: 'selected-order' }],
      pagination: { currentPage: 2, lastPage: 2 },
    };
    listSalesMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(matchingPage);

    const options = getMySalesOrderOptions('selected-order', 'selected-item');
    const response = await options.queryFn!({} as never);

    expect(options.queryKey).toEqual(myOrdersQueryKey.salesOrder('selected-order', 'selected-item'));
    expect(listSalesMock).toHaveBeenNthCalledWith(1, 1);
    expect(listSalesMock).toHaveBeenNthCalledWith(2, 2);
    expect(response).toBe(matchingPage);
  });

  it('scans all sales pages before treating an order as unavailable', async () => {
    const firstPage = {
      data: [{ id: 'recent-item', orderId: 'recent-order' }],
      pagination: { currentPage: 1, lastPage: 2 },
    };
    const finalPage = {
      data: [{ id: 'older-item', orderId: 'older-order' }],
      pagination: { currentPage: 2, lastPage: 2 },
    };
    listSalesMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(finalPage);

    const options = getMySalesOrderOptions('missing-order');
    const response = await options.queryFn!({} as never);

    expect(listSalesMock).toHaveBeenCalledTimes(2);
    expect(response).toBe(finalPage);
  });
});
