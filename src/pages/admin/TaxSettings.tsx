import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface TaxSetting {
  id: string;
  name: string;
  rate: number;
  active: boolean;
}

const TaxSettings = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxSetting | null>(null);
  const [form, setForm] = useState({ name: "", rate: "", active: true });
  const [saving, setSaving] = useState(false);

  const { data: taxes, isLoading } = useQuery({
    queryKey: ["tax-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_settings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaxSetting[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", rate: "", active: true });
    setOpen(true);
  };

  const openEdit = (t: TaxSetting) => {
    setEditing(t);
    setForm({ name: t.name, rate: String(t.rate), active: t.active });
    setOpen(true);
  };

  const handleSave = async () => {
    const rate = parseFloat(form.rate);
    if (!form.name.trim() || isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Invalid input", description: "Provide a name and rate between 0 and 100.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("tax_settings")
          .update({ name: form.name.trim(), rate, active: form.active })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Tax updated" });
      } else {
        if (form.active) {
          // Only one active tax at a time — deactivate others
          await supabase.from("tax_settings").update({ active: false }).eq("active", true);
        }
        const { error } = await supabase
          .from("tax_settings")
          .insert({ name: form.name.trim(), rate, active: form.active });
        if (error) throw error;
        toast({ title: "Tax created" });
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["tax-settings"] });
      qc.invalidateQueries({ queryKey: ["active-tax"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tax rate?")) return;
    const { error } = await supabase.from("tax_settings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Tax deleted" });
    qc.invalidateQueries({ queryKey: ["tax-settings"] });
    qc.invalidateQueries({ queryKey: ["active-tax"] });
  };

  const handleToggleActive = async (t: TaxSetting) => {
    if (!t.active) {
      await supabase.from("tax_settings").update({ active: false }).eq("active", true);
    }
    await supabase.from("tax_settings").update({ active: !t.active }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["tax-settings"] });
    qc.invalidateQueries({ queryKey: ["active-tax"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tax Settings</h1>
          <p className="text-sm text-muted-foreground">Manage tax rates applied to all orders at checkout.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Tax</Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !taxes || taxes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No tax rates configured yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{Number(t.rate).toFixed(2)}%</TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(t)}>
                      <Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Active" : "Inactive"}</Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="VAT" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (%)</Label>
              <Input id="rate" type="number" step="0.01" min="0" max="100" placeholder="15" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active (applied to checkout)</Label>
              <Switch id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <p className="text-xs text-muted-foreground">Only one tax rate can be active at a time. Setting this active will deactivate others.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxSettings;
