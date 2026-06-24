import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getDiscountCodesOptions,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeleteDiscountCode,
} from "@/queries/useAdminDiscountCodes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Loader2, Trash2, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DiscountCodes = () => {
  const { data: codes = [], isLoading } = useQuery(getDiscountCodesOptions());

  const createMutation = useCreateDiscountCode();
  const updateMutation = useUpdateDiscountCode();
  const deleteMutation = useDeleteDiscountCode();

  const [dialogOpen, setDialogOpen] = useState(false);

  // form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const resetForm = () => {
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrder("");
    setMaxUses("");
    setExpiresAt("");
  };

  const handleCreate = async () => {
    if (!code.trim() || !discountValue) return;

    try {
      await createMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrder ? Number(minOrder) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      });

      toast({
        title: "Code created",
      });

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({
        discountCodeId: id,
        payload: {
          active: !active,
        },
      });

      toast({
        title: "Status updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);

      toast({
        title: "Code deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Discount Codes
          </h1>

          <p className="text-sm text-muted-foreground">
            {codes.length} total codes
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Code
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Code</Label>

                <Input
                  placeholder="SUMMER20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>

                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>

                      <SelectItem value="FIXED">Fixed (Rs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>

                  <Input
                    type="number"
                    value={discountValue}
                    placeholder="20"
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min order (Rs)</Label>

                  <Input
                    type="number"
                    placeholder="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max uses</Label>

                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expires at</Label>

                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending || !code.trim() || !discountValue
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Code"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/40 mb-3" />

          <p className="text-sm text-muted-foreground">No discount codes yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold text-foreground">
                    {c.code}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}%`
                        : `Rs ${c.discountValue.toLocaleString()}`}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {c.minOrderAmount > 0
                      ? `Rs ${c.minOrderAmount.toLocaleString()}`
                      : "—"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {c.currentUses}
                    {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-xs">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => toggleActive(c.id, c.active)}
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCode(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DiscountCodes;
