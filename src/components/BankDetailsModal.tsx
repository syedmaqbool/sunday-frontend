import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Landmark, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateBankDetails } from "@/queries/useMyProfile";

const bankSchema = z.object({
  bank_account_holder: z
    .string()
    .trim()
    .min(2, "Account holder name is required")
    .max(100),

  bank_name: z
    .string()
    .trim()
    .min(2, "Bank name is required")
    .max(80),

  bank_account_number: z
    .string()
    .trim()
    .min(4, "Account number must be at least 4 digits")
    .max(20, "Account number must be at most 20 digits")
    .regex(/^\d+$/, "Account number must contain digits only"),

  bank_iban: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .min(15, "IBAN must be 15–34 characters")
        .max(34, "IBAN must be 15–34 characters")
        .regex(
          /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/,
          "Invalid IBAN format"
        )
    ),

  bank_swift: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$/,
          "Invalid SWIFT/BIC format"
        )
    )
    .optional(),
});

export type BankFormValues = {
  bank_account_holder: string;
  bank_name: string;
  bank_account_number: string;
  bank_iban: string;
  bank_swift: string;
};

interface BankDetailsModalProps {
  open: boolean;
  onSaved: () => void;
  onCancel: () => void;
  initialValues?: Partial<BankFormValues>;
}

const empty: BankFormValues = {
  bank_account_holder: "",
  bank_name: "",
  bank_account_number: "",
  bank_iban: "",
  bank_swift: "",
};

const BankDetailsModal = ({
  open,
  onSaved,
  onCancel,
  initialValues,
}: BankDetailsModalProps) => {
  const updateBankDetails = useUpdateBankDetails();

  const isEditing = !!(
    initialValues &&
    (initialValues.bank_iban || initialValues.bank_account_number)
  );

  const [form, setForm] = useState<BankFormValues>({
    ...empty,
    ...initialValues,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BankFormValues, string>>
  >({});

  useEffect(() => {
    if (open) {
      setForm({ ...empty, ...initialValues });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleSave = () => {
    const result = bankSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof BankFormValues, string>
      > = {};

      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof BankFormValues;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    updateBankDetails.mutate(
      {
        bankAccountHolder: result.data.bank_account_holder,
        bankName: result.data.bank_name,
        bankAccountNumber: result.data.bank_account_number,
        bankIban: result.data.bank_iban,
        bankSwift: result.data.bank_swift,
      },
      {
        onSuccess: () => {
          toast.success(
            isEditing
              ? "Payout details updated"
              : "Payout details saved"
          );
          onSaved();
        },

        onError: (err: any) => {
          toast.error(err.message || "Failed to save");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>

          <DialogTitle>
            {isEditing
              ? "Edit payout details"
              : "Add your payout details"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Update the bank account we use to pay you out."
              : "We need your bank account so we can pay you out when your items sell."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            Add correct bank details for smooth payout. Incorrect
            details may delay payments.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <div>
            <Label>Account holder name</Label>
            <Input
              value={form.bank_account_holder}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bank_account_holder: e.target.value,
                }))
              }
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
              value={form.bank_name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bank_name: e.target.value,
                }))
              }
            />
            {errors.bank_name && (
              <p className="text-xs text-destructive">
                {errors.bank_name}
              </p>
            )}
          </div>

          <div>
            <Label>Account number</Label>
            <Input
              inputMode="numeric"
              value={form.bank_account_number}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bank_account_number: e.target.value.replace(/\D/g, ""),
                }))
              }
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
              value={form.bank_iban}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bank_iban: e.target.value.toUpperCase(),
                }))
              }
            />
            {errors.bank_iban && (
              <p className="text-xs text-destructive">
                {errors.bank_iban}
              </p>
            )}
          </div>

          <div>
            <Label>SWIFT / BIC (optional)</Label>
            <Input
              value={form.bank_swift}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bank_swift: e.target.value.toUpperCase(),
                }))
              }
            />
            {errors.bank_swift && (
              <p className="text-xs text-destructive">
                {errors.bank_swift}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={updateBankDetails.isPending}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={updateBankDetails.isPending}
          >
            {updateBankDetails.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {isEditing ? "Save changes" : "Save & continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;