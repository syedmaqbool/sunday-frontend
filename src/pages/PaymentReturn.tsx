import { Navigate, useSearchParams } from 'react-router-dom';

// PayFast returns the buyer here after hosted checkout. The redirect is not proof of payment, so
// send the buyer to the order or boost status view, which renders the backend's payment state.
function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const boostPurchaseId = searchParams.get('boostPurchaseId');

  if (orderId) {
    return <Navigate replace to={`/order-confirmation/${encodeURIComponent(orderId)}`} />;
  }
  if (boostPurchaseId) {
    return (
      <Navigate replace to={`/boost?boostPurchaseId=${encodeURIComponent(boostPurchaseId)}`} />
    );
  }

  return <Navigate replace to="/profile" />;
}

export default PaymentReturn;
