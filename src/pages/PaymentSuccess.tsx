import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get('orderId');

  // Success is the only outcome that clears the cart. Cancel and the
  // PayFast-failed fallback intentionally leave it intact for retry.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  if (!orderId)
    return <Navigate replace to="/profile" />;

  return <Navigate replace to={`/order-confirmation/${encodeURIComponent(orderId)}`} />;
}
