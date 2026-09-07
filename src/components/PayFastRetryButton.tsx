import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { submitPayFast } from '@/lib/payfast';
import { useRetryPayFastOrderMutation } from '@/queries/checkout.query';

interface PayFastRetryButtonProps {
  orderId: string;
  className?: string;
  size?: 'default' | 'icon' | 'lg' | 'sm';
  variant?: 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary';
}

export function PayFastRetryButton({
  orderId,
  className,
  size = 'default',
  variant = 'default',
}: PayFastRetryButtonProps) {
  const [retrying, setRetrying] = useState(false);
  const { mutateAsync: retryPayFast } = useRetryPayFastOrderMutation();

  const handleRetry = async () => {
    if (retrying)
      return;

    setRetrying(true);
    try {
      const response = await retryPayFast(orderId);
      if (!response.data?.paymentUrl || !response.data.fields) {
        throw new Error('Payment could not be initialized.');
      }
      submitPayFast(response.data);
    }
    catch (error: any) {
      toast.error(error?.message ?? 'Unable to retry payment.');
    }
    finally {
      setRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={retrying}
      size={size}
      type="button"
      variant={variant}
      className={className}
    >
      {retrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Retry payment
    </Button>
  );
}
