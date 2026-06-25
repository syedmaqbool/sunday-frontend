import { AlertTriangle, Landmark, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateBankDetails } from '@/queries/useMyProfile';

const bankSchema = z.object({
  bank_account_holder: z
    .string()
    .trim()
    .min(2, 'Account holder name is required')
    .max(100),

  bank_account_number: z
    .string()
    .trim()
    .min(4, 'Account number must be at least 4 digits')
    .max(20, 'Account number must be at most 20 digits')
    .regex(/^\d+$/, 'Account number must contain digits only'),

  bank_iban: z
    .string()
    .trim()
    .transform(v => v.replaceAll(/\s+/g, '').toUpperCase())
    .pipe(
      z
        .string()
        .min(15, 'IBAN must be 15–34 characters')
        .max(34, 'IBAN must be 15–34 characters')
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, 'Invalid IBAN format'),
    ),

  bank_name: z.string().trim().min(2, 'Bank name is required').max(80),

  bank_swift: z
    .string()
    .trim()
    .transform(v => v.replaceAll(/\s+/g, '').toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$/,
          'Invalid SWIFT/BIC format',
        ),
    )
    .optional(),
});

export interface BankFormValues {
  bank_account_holder: string;
  bank_account_number: string;
  bank_iban: string;
  bank_name: string;
  bank_swift: string;
}

interface BankDetailsModalProps {
  initialValues?: Partial<BankFormValues>;
  onCancel: () => void;
  onSaved: () => void;
  open: boolean;
}

const empty: BankFormValues = {
  bank_account_holder: '',
  bank_account_number: '',
  bank_iban: '',
  bank_name: '',
  bank_swift: '',
};

function BankDetailsModal({
  initialValues,
  onCancel,
  onSaved,
  open,
}: BankDetailsModalProps) {
  const updateBankDetails = useUpdateBankDetails();

  const isEditing = !!(
    initialValues
    && (initialValues.bank_iban || initialValues.bank_account_number)
  );

  const [form, setForm] = useState<BankFormValues>({
    ...empty,
    ...initialValues,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BankFormValues, string>>
  >({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({ ...empty, ...initialValues });
    setErrors({});
  }, [open, initialValues]);

  const handleSave = () => {
    const result = bankSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof BankFormValues, string>> = {};

      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof BankFormValues;
        if (!Object.hasOwn(fieldErrors, key)) {
          fieldErrors[key] = issue.message;
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    updateBankDetails.mutate(
      {
        bankAccountHolder: result.data.bank_account_holder,
        bankAccountNumber: result.data.bank_account_number,
        bankIban: result.data.bank_iban,
        bankName: result.data.bank_name,
        bankSwift: result.data.bank_swift,
      },
      {
        onError: (error: any) => {
          toast.error(error.message || 'Failed to save');
        },

        onSuccess: () => {
          toast.success(
            isEditing ? 'Payout details updated' : 'Payout details saved',
          );
          onSaved();
        },
      },
    );
  };

  return (
    <Dialog onOpenChange={o => !o && onCancel()} open={open}>
      <DialogContent className="
        max-h-[90vh] overflow-y-auto
        sm:max-w-md
      "
      >
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>

          <DialogTitle>
            {isEditing ? 'Edit payout details' : 'Add your payout details'}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? 'Update the bank account we use to pay you out.'
              : 'We need your bank account so we can pay you out when your items sell.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            Add correct bank details for smooth payout. Incorrect details may
            delay payments.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <div>
            <Label>Account holder name</Label>
            <Input
              onChange={event =>
                setForm(f => ({
                  ...f,
                  bank_account_holder: event.target.value,
                }))}
              value={form.bank_account_holder}
            />
            {errors.bank_account_holder && (
              <p className="text-xs text-destructive">
                {errors.bank_account_holder}
              </p>
            )}
          </div>

          <div>
            <Label>Bank name</Label>
            <Input
              onChange={event =>
                setForm(f => ({
                  ...f,
                  bank_name: event.target.value,
                }))}
              value={form.bank_name}
            />
            {errors.bank_name && (
              <p className="text-xs text-destructive">{errors.bank_name}</p>
            )}
          </div>

          <div>
            <Label>Account number</Label>
            <Input
              onChange={event =>
                setForm(f => ({
                  ...f,
                  bank_account_number: event.target.value.replaceAll(/\D/g, ''),
                }))}
              value={form.bank_account_number}
              inputMode="numeric"
            />
            {errors.bank_account_number && (
              <p className="text-xs text-destructive">
                {errors.bank_account_number}
              </p>
            )}
          </div>

          <div>
            <Label>IBAN</Label>
            <Input
              onChange={event =>
                setForm(f => ({
                  ...f,
                  bank_iban: event.target.value.toUpperCase(),
                }))}
              value={form.bank_iban}
            />
            {errors.bank_iban && (
              <p className="text-xs text-destructive">{errors.bank_iban}</p>
            )}
          </div>

          <div>
            <Label>SWIFT / BIC (optional)</Label>
            <Input
              onChange={event =>
                setForm(f => ({
                  ...f,
                  bank_swift: event.target.value.toUpperCase(),
                }))}
              value={form.bank_swift}
            />
            {errors.bank_swift && (
              <p className="text-xs text-destructive">{errors.bank_swift}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onCancel}
            disabled={updateBankDetails.isPending}
            variant="ghost"
          >
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={updateBankDetails.isPending}>
            {updateBankDetails.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {isEditing ? 'Save changes' : 'Save & continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BankDetailsModal;
