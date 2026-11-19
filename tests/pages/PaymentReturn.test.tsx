import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vite-plus/test';
import PaymentReturn from '@/pages/PaymentReturn';

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
