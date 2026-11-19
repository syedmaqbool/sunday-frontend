import { Navigate, useSearchParams } from 'react-router-dom';

// PayFast returns the buyer here after hosted checkout. The redirect is not proof of payment, so
// send the buyer to the order status view, which renders the backend's authoritative payment state.
function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  if (!orderId) return <Navigate replace to="/profile" />;

  return <Navigate replace to={`/order-confirmation/${encodeURIComponent(orderId)}`} />;
}

export default PaymentReturn;
