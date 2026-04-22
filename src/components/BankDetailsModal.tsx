import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Landmark } from "lucide-react";
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
});

interface BankDetailsModalProps {
  open: boolean;
  onSaved: () => void;
  onCancel: () => void;
}

const BankDetailsModal = ({ open, onSaved, onCancel }: BankDetailsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_account_holder: "",
    bank_name: "",
    bank_account_number: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const handleSave = async () => {
    if (!user) return;
    const result = bankSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof typeof form, string>> = {};
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof typeof form;
        if (!fieldErrors[key]) fieldErrors[key] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(result.data)
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payout details saved", description: "We'll use these for your future sales." });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Add your payout details</DialogTitle>
          <DialogDescription>
            We need your bank account so we can pay you out when your items sell.
            This is only asked once and saved securely to your profile.
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;
