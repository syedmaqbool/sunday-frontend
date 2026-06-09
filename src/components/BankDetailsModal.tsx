import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Landmark, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const bankSchema = z.object({
  bank_account_holder: z.string().trim().min(2, "Account holder name is required").max(100),
  bank_name: z.string().trim().min(2, "Bank name is required").max(80),
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
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "Invalid IBAN format")
    ),
  bank_swift: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .regex(/^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$/, "Invalid SWIFT/BIC format")
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

const BankDetailsModal = ({ open, onSaved, onCancel, initialValues }: BankDetailsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEditing = !!(initialValues && (initialValues.bank_iban || initialValues.bank_account_number));
  const [form, setForm] = useState<BankFormValues>({ ...empty, ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof BankFormValues, string>>>({});

  useEffect(() => {
    if (open) {
      setForm({ ...empty, ...initialValues });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleSave = async () => {
    if (!user) return;
    const result = bankSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof BankFormValues, string>> = {};
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof BankFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        bank_account_holder: result.data.bank_account_holder,
        bank_name: result.data.bank_name,
        bank_account_number: result.data.bank_account_number,
        bank_iban: result.data.bank_iban,
        bank_swift: result.data.bank_swift || null,
      })
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: isEditing ? "Payout details updated" : "Payout details saved",
      description: "We'll use these for your future sales.",
    });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{isEditing ? "Edit payout details" : "Add your payout details"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the bank account we use to pay you out."
              : "We need your bank account so we can pay you out when your items sell. Saved securely to your profile."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="bank_account_holder">Account holder name</Label>
            <Input
              id="bank_account_holder"
              placeholder="As it appears on the account"
              value={form.bank_account_holder}
              onChange={(e) => setForm((f) => ({ ...f, bank_account_holder: e.target.value }))}
              maxLength={100}
            />
            {errors.bank_account_holder && (
              <p className="text-xs text-destructive">{errors.bank_account_holder}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank name</Label>
            <Input
              id="bank_name"
              placeholder="e.g. FNB, Standard Bank, Capitec"
              value={form.bank_name}
              onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
              maxLength={80}
            />
            {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_account_number">Account number</Label>
            <Input
              id="bank_account_number"
              inputMode="numeric"
              placeholder="Digits only"
              value={form.bank_account_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, bank_account_number: e.target.value.replace(/\D/g, "") }))
              }
              maxLength={20}
            />
            {errors.bank_account_number && (
              <p className="text-xs text-destructive">{errors.bank_account_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_iban">IBAN</Label>
            <Input
              id="bank_iban"
              placeholder="e.g. NL91 ABNA 0417 1643 00"
              value={form.bank_iban}
              onChange={(e) =>
                setForm((f) => ({ ...f, bank_iban: e.target.value.toUpperCase() }))
              }
              maxLength={42}
              autoCapitalize="characters"
              spellCheck={false}
            />
            {errors.bank_iban && <p className="text-xs text-destructive">{errors.bank_iban}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_swift">
              SWIFT / BIC <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="bank_swift"
              placeholder="e.g. ABNANL2A"
              value={form.bank_swift}
              onChange={(e) =>
                setForm((f) => ({ ...f, bank_swift: e.target.value.toUpperCase() }))
              }
              maxLength={11}
              autoCapitalize="characters"
              spellCheck={false}
            />
            {errors.bank_swift && <p className="text-xs text-destructive">{errors.bank_swift}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save changes" : "Save & continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;
