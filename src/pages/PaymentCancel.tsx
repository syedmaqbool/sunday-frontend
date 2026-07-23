import { HTTPError } from 'ky';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCancelOrderMutation } from '@/queries/checkout.query';
import { fetchMarketplaceListing } from '@/queries/marketplace.query';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { loading: authLoading, user } = useAuth();
  const { addItem } = useCart();
  const { mutateAsync: cancelOrder } = useCancelOrderMutation();
  const [phase, setPhase] = useState<'failed' | 'working'>('working');
  const attemptedReference = useRef(false);

  const runCancellation = async (id: string) => {
    setPhase('working');
    try {
      const response = await cancelOrder(id);
      const restorableListingIds = response.data.restorableListingIds;
      await Promise.all(restorableListingIds.map(async (listingId) => {
        const listing = await fetchMarketplaceListing(listingId);
        if (listing)
          addItem(listing);
      }));
      navigate(`/order-confirmation/${encodeURIComponent(id)}`, { replace: true });
    }
    catch (error) {
      // 409 (already resolved, e.g. paid/cancelled) and 404 (not found/not ours)
      // both defer to the order-confirmation page's own state handling.
      if (error instanceof HTTPError && (error.response.status === 409 || error.response.status === 404)) {
        navigate(`/order-confirmation/${encodeURIComponent(id)}`, { replace: true });
        return;
      }
      setPhase('failed');
    }
  };

  useEffect(() => {
    if (!orderId || authLoading)
      return;

    if (!user) {
      navigate('/auth', {
        replace: true,
        state: { from: `/payment/cancel?orderId=${encodeURIComponent(orderId)}` },
      });
      return;
    }

    if (attemptedReference.current)
      return;
    attemptedReference.current = true;
    void runCancellation(orderId);
    // eslint-disable-next-line react/exhaustive-deps
  }, [orderId, authLoading, user, navigate]);

  if (!orderId)
    return <Navigate replace to="/profile" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        {phase === 'working' && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {phase === 'failed' && (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground">Cancellation failed</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              We couldn't cancel this order. Please check your connection and try again.
            </p>
            <Button onClick={() => void runCancellation(orderId)} type="button">
              Retry
            </Button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
