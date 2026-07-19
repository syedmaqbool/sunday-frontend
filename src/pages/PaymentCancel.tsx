import { Navigate, useSearchParams } from 'react-router-dom';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  if (!orderId)
    return <Navigate replace to="/profile" />;

  return <Navigate replace to={`/order-confirmation/${encodeURIComponent(orderId)}`} />;
}
