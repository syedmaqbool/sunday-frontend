import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import PaymentReturn from '@/pages/PaymentReturn';

const { clearCartMock } = vi.hoisted(() => ({ clearCartMock: vi.fn() }));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ loading: false }) }));
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ clearCart: clearCartMock }),
}));

beforeEach(() => {
  clearCartMock.mockReset();
});

function renderReturnPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PaymentReturn />} path="/payment/success" />
        <Route element={<PaymentReturn />} path="/payment/cancel" />
        <Route element={<div>Order status page</div>} path="/order-confirmation/:id" />
        <Route element={<div>Buyer order list</div>} path="/profile" />
        <Route element={<div>Boost status page</div>} path="/boost" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('payment return', () => {
  it('sends a success return to the backend-backed order status view', async () => {
    renderReturnPath('/payment/success?orderId=order-id');

    expect(await screen.findByText('Order status page')).toBeInTheDocument();
  });

  it('sends a cancelled return to the same order status view instead of trusting the redirect', async () => {
    renderReturnPath('/payment/cancel?orderId=order-id');

    expect(await screen.findByText('Order status page')).toBeInTheDocument();
  });

  it.each(['/payment/success?orderId=order-id', '/payment/cancel?orderId=order-id'])(
    'empties the cart before showing the order when the buyer returns on %s',
    async path => {
      renderReturnPath(path);

      await screen.findByText('Order status page');
      expect(clearCartMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    '/payment/success?boostPurchaseId=purchase-id',
    '/payment/cancel?boostPurchaseId=purchase-id',
  ])('leaves the cart alone on the boost return %s', async path => {
    renderReturnPath(path);

    await screen.findByText('Boost status page');
    expect(clearCartMock).not.toHaveBeenCalled();
  });

  it('leaves the cart alone when the return names neither an order nor a boost', async () => {
    renderReturnPath('/payment/success');

    await screen.findByText('Buyer order list');
    expect(clearCartMock).not.toHaveBeenCalled();
  });

  it('sends a boost success return to the boost status view without treating the redirect as paid', async () => {
    renderReturnPath('/payment/success?boostPurchaseId=purchase-id');

    expect(await screen.findByText('Boost status page')).toBeInTheDocument();
  });

  it('sends a cancelled boost return to the boost status view for the same purchase', async () => {
    renderReturnPath('/payment/cancel?boostPurchaseId=purchase-id');

    expect(await screen.findByText('Boost status page')).toBeInTheDocument();
  });

  it('falls back to the buyer order list when the return has no order', async () => {
    renderReturnPath('/payment/success');

    expect(await screen.findByText('Buyer order list')).toBeInTheDocument();
  });
});
