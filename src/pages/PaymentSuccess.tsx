import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get('orderId');

  // This route is retained for historical PayFast callbacks. Manual orders
  // navigate directly to their order confirmation instead.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  if (!orderId)
    return <Navigate replace to="/profile" />;

  return <Navigate replace to={`/order-confirmation/${encodeURIComponent(orderId)}`} />;
}
