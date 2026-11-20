import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

// The buyer arrives from PayFast on a full page load. The cart first hydrates the guest key, then
// reloads the signed-in buyer's key once auth resolves, which would bring a cart cleared too early
// straight back. So wait for auth to settle, give the cart one commit to hydrate for that identity,
// clear it, and only then leave for the order status view.
function ClearCartThenShowOrder({ orderId }: { orderId: string }) {
  const { loading } = useAuth();
  const { clearCart } = useCart();
  const [authSettled, setAuthSettled] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!loading) setAuthSettled(true);
  }, [loading]);

  useEffect(() => {
    if (!authSettled) return;
    clearCart();
    setCleared(true);
  }, [authSettled, clearCart]);

  if (!cleared) return null;
  return <Navigate replace to={`/order-confirmation/${encodeURIComponent(orderId)}`} />;
}

// PayFast returns the buyer here after hosted checkout, on success and cancel alike. The redirect
// is not proof of payment, so send the buyer to the order or boost status view, which renders the
// backend's payment state. The cart is emptied here, not at handoff, so it survives until the
// buyer is actually back. Boost returns have no cart and leave it alone.
function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const boostPurchaseId = searchParams.get('boostPurchaseId');

  if (orderId) {
    return <ClearCartThenShowOrder orderId={orderId} />;
  }
  if (boostPurchaseId) {
    return (
      <Navigate replace to={`/boost?boostPurchaseId=${encodeURIComponent(boostPurchaseId)}`} />
    );
  }

  return <Navigate replace to="/profile" />;
}

export default PaymentReturn;
