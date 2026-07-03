import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utilities';

interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex min-h-screen items-center justify-center', className)}>
      <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
    </div>
  );
}
