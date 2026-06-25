import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STATUS_LABEL: Record<string, string> = {
  RAISED: 'Complaint Raised',
  REFUNDED: 'Completed · Refunded',
  REJECTED: 'Completed · Rejected',
  RETURN_ADDRESS_PROVIDED: 'Return Address Provided',
  RETURN_APPROVED: 'Return Approved',
  RETURN_IN_TRANSIT: 'Return In Transit',
  RETURN_RECEIVED: 'Return Received',
  UNDER_REVIEW: 'Under Review',
};

export interface ComplaintDetailsData {
  id: string;
  adminNotes?: string | null;
  evidenceUrls: string[];
  reason: string;
  returnAddress?: string | null;
  returnAddressPhone?: string | null;
  returnAddressRecipient?: string | null;
  returnCarrier?: string | null;
  returnInstructions?: string | null;
  returnProofUrls?: string[] | null;
  returnTracking?: string | null;
  status: string;
  createdAt?: string;
}

export function ComplaintDetailsView({
  className,
  complaint,
  viewerRole,
}: {
  className?: string;
  complaint: ComplaintDetailsData;
  viewerRole: 'buyer' | 'seller';
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const isCompleted
    = ['REFUNDED', 'REJECTED'].includes(complaint.status);
  const isReturn
    = [
      'RETURN_IN_TRANSIT',
      'RETURN_RECEIVED',
      'RETURN_ADDRESS_PROVIDED',
      'RETURN_APPROVED',
    ].includes(complaint.status);
  const Icon = isCompleted
    ? CheckCircle2
    : (isReturn
        ? PackageCheck
        : AlertTriangle);

  const evidence = complaint.evidenceUrls ?? [];
  const proofs = complaint.returnProofUrls ?? [];
  const hasReturnAddress = !!(
    complaint.returnAddress || complaint.returnAddressRecipient
  );

  return (
    <div className={`
      mt-2
      ${className ?? ''}
    `}
    >
      <button
        onClick={() => setOpen(true)}
        aria-label="View complaint details"
        type="button"
        className="inline-flex"
      >
        <Badge className="
          cursor-pointer gap-1 bg-amber-500/15 text-amber-700
          hover:bg-amber-500/25
        "
        >
          <Icon className="h-3 w-3" />
          {STATUS_LABEL[complaint.status] ?? complaint.status}
        </Badge>
      </button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <Icon className="h-5 w-5" />
              {STATUS_LABEL[complaint.status] ?? complaint.status}
            </DialogTitle>
            {complaint.createdAt && (
              <DialogDescription>
                Raised
                {' '}
                {format(new Date(complaint.createdAt), 'PPp')}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {complaint.reason && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {viewerRole === 'seller' ? 'Buyer\'s message' : 'Your message'}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {complaint.reason}
                </p>
              </div>
            )}

            {evidence.length > 0 && (
              <div>
                <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  {' '}
                  Evidence photos (
                  {evidence.length}
                  )
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {evidence.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setPreview(url)}
                      type="button"
                      className="h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasReturnAddress && (
              <div>
                <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {' '}
                  Ship return to
                </p>
                <div className="mt-1 space-y-0.5 text-sm text-foreground">
                  {complaint.returnAddressRecipient && (
                    <p className="font-medium">{complaint.returnAddressRecipient}</p>
                  )}
                  {complaint.returnAddress && (
                    <p>{complaint.returnAddress}</p>
                  )}
                  {complaint.returnAddressPhone && (
                    <p className="text-muted-foreground">
                      {complaint.returnAddressPhone}
                    </p>
                  )}
                  {complaint.returnInstructions && (
                    <p className="text-xs italic text-muted-foreground">
                      {complaint.returnInstructions}
                    </p>
                  )}
                </div>
              </div>
            )}

            {proofs.length > 0 && (
              <div>
                <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <PackageCheck className="h-3 w-3" />
                  {' '}
                  Return proof (
                  {proofs.length}
                  )
                </p>
                {(complaint.returnCarrier || complaint.returnTracking) && (
                  <p className="text-xs text-muted-foreground">
                    {complaint.returnCarrier ?? ''}
                    {complaint.returnTracking
                      ? ` · ${complaint.returnTracking}`
                      : ''}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {proofs.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setPreview(url)}
                      type="button"
                      className="h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
                    >
                      <img
                        src={url}
                        alt={`Return proof ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isCompleted && complaint.adminNotes && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Admin note
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {complaint.adminNotes}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={o => !o && setPreview(null)} open={!!preview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Photo</DialogTitle>
          </DialogHeader>
          {preview && (
            <img
              src={preview}
              alt="Complaint attachment"
              className="max-h-[75vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
