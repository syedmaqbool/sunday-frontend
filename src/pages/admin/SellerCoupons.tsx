import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authInstance } from "@/services/ky.instance";
import {
  getSellerCouponsOptions,
  useCreateSellerCoupon,
  useUpdateSellerCoupon,
  useDeleteSellerCoupon,
} from "@/queries/useAdminSellerCoupons";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Trash2, Tag, Pencil, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────
type DiscountType = "percentage" | "fixed";
type Scope = "seller_wide" | "item_based";

interface SellerCouponDisplay {
  id: string;
  code: string;
  seller_id: string;
  seller_name?: string | null;
  listing_id?: string | null; // ← single listing (not array)
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  per_user_limit: number | null;
  scope: Scope;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

interface SellerOption {
  id: string;
  full_name: string | null;
}
interface ListingOption {
  id: string;
  title: string;
}

// ── Adapters ─────────────────────────────────────────────────────────────────
function adaptCoupon(c: any, sellerName?: string | null): SellerCouponDisplay {
  return {
    id: c.id,
    code: c.code,
    seller_id: c.sellerId,
    seller_name: sellerName ?? null,
    listing_id: c.listingId ?? null,
    discount_type: (c.discountType as string).toLowerCase() as DiscountType,
    discount_value: Number(c.discountValue),
    min_order_amount: Number(c.minOrderAmount ?? 0),
    max_uses: c.maxUses ?? null,
    current_uses: c.currentUses ?? 0,
    per_user_limit: c.perUserLimit ?? null,
    scope: (c.scope as string).toLowerCase() as Scope,
    starts_at: c.startsAt ?? null,
    expires_at: c.expiresAt ?? null,
    active: c.active,
    created_at: c.createdAt,
  };
}

function formToPayload(form: typeof emptyForm) {
  return {
    code: form.code.trim().toUpperCase(),
    sellerId: form.seller_id,
    discountType: form.discount_type.toUpperCase(),
    discountValue: Number(form.discount_value),
    minOrderAmount: form.min_order_amount ? Number(form.min_order_amount) : 0,
    maxUses: form.max_uses ? Number(form.max_uses) : null,
    perUserLimit: form.per_user_limit ? Number(form.per_user_limit) : null,
    scope: form.scope.toUpperCase(),
    startsAt: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    expiresAt: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    listingId: form.scope === "item_based" ? form.listing_id || null : null,
  };
}

const emptyForm = {
  code: "",
  seller_id: "",
  discount_type: "percentage" as DiscountType,
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  per_user_limit: "",
  scope: "seller_wide" as Scope,
  starts_at: "",
  expires_at: "",
  listing_id: "", // ← single listing ID
};

// ── Component ─────────────────────────────────────────────────────────────────
const SellerCoupons = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [redemptionsFor, setRedemptionsFor] =
    useState<SellerCouponDisplay | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: couponsRaw = [], isLoading } = useQuery(
    getSellerCouponsOptions(),
  );

  const { data: sellersRaw } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () =>
      authInstance.get("/api/v1/admin/users?size=100").json<{ data: any[] }>(),
  });

  const sellers: SellerOption[] = useMemo(
    () =>
      (sellersRaw?.data ?? []).map((u: any) => ({
        id: u.id,
        full_name:
          (u.fullName ??
            u.profile?.fullName ??
            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()) ||
          undefined,
      })),
    [sellersRaw],
  );

  const sellerMap = useMemo(
    () => new Map(sellers.map((s) => [s.id, s.full_name])),
    [sellers],
  );

  const coupons: SellerCouponDisplay[] = useMemo(
    () =>
      (couponsRaw as any[]).map((c) =>
        adaptCoupon(c, sellerMap.get(c.sellerId)),
      ),
    [couponsRaw, sellerMap],
  );

  // Listings for selected seller (item_based scope only)
  const { data: listingsRaw } = useQuery({
    queryKey: ["seller-listings", form.seller_id],
    queryFn: () =>
      authInstance
        .get(
          `/api/v1/listings?sellerId=${form.seller_id}&status=approved&size=100`,
        )
        .json<{ data: any[] }>(),
    enabled: !!form.seller_id && form.scope === "item_based",
  });

  const listings: ListingOption[] = useMemo(
    () =>
      (listingsRaw?.data ?? []).map((l: any) => ({ id: l.id, title: l.title })),
    [listingsRaw],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCoupon = useCreateSellerCoupon();
  const updateCoupon = useUpdateSellerCoupon();
  const deleteCouponM = useDeleteSellerCoupon();

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  // openEdit — no extra API call, listingId already in coupon
  const openEdit = (c: SellerCouponDisplay) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      seller_id: c.seller_id,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "",
      max_uses: c.max_uses !== null ? String(c.max_uses) : "",
      per_user_limit: c.per_user_limit !== null ? String(c.per_user_limit) : "",
      scope: c.scope,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
      listing_id: c.listing_id ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.seller_id || !form.discount_value) {
      toast({
        title: "Missing fields",
        description: "Code, seller and discount value are required.",
        variant: "destructive",
      });
      return;
    }
    if (form.scope === "item_based" && !form.listing_id) {
      toast({
        title: "Select a listing",
        description: "Item-based coupons need one listing.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editingId) {
        await updateCoupon.mutateAsync({ id: editingId, payload });
        toast({ title: "Coupon updated" });
      } else {
        await createCoupon.mutateAsync(payload as any);
        toast({ title: "Coupon created" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = (c: SellerCouponDisplay) =>
    updateCoupon.mutate({ id: c.id, payload: { active: !c.active } });

  const deleteCoupon = (id: string) => {
    if (!confirm("Delete this coupon? Redemption history will be removed."))
      return;
    deleteCouponM.mutate(id, {
      onSuccess: () => toast({ title: "Coupon deleted" }),
      onError: (e: any) =>
        toast({
          title: "Delete failed",
          description: e?.message,
          variant: "destructive",
        }),
    });
  };

  const openRedemptions = async (c: SellerCouponDisplay) => {
    setRedemptionsFor(c);
    try {
      const res = await authInstance
        .get(`/api/v1/admin/seller-coupons/${c.id}/redemptions`)
        .json<{ data: any[] }>();
      setRedemptions(res.data ?? []); // ← { data: [...] } shape
    } catch {
      setRedemptions([]);
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
            Seller Coupons
          </h1>
          <p className="text-sm text-muted-foreground">
            {coupons.length} coupons assigned to sellers
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Tag className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No seller coupons yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold text-foreground">
                    {c.code}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.seller_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {c.discount_type === "percentage"
                        ? `${c.discount_value}%`
                        : `Rs ${c.discount_value.toLocaleString()}`}
                    </Badge>
                    {c.min_order_amount > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        min Rs {c.min_order_amount.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.scope === "seller_wide"
                      ? "All seller items"
                      : "Specific item"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.starts_at
                      ? new Date(c.starts_at).toLocaleDateString()
                      : "—"}
                    {" → "}
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.current_uses}
                    {c.max_uses !== null ? ` / ${c.max_uses}` : ""}
                    {c.per_user_limit ? ` · ${c.per_user_limit}/user` : ""}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => toggleActive(c)}
                    />
                  </TableCell>
                  <TableCell className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openRedemptions(c)}
                      title="Usage"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCoupon(c.id)}
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

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Coupon" : "Create Seller Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="SELLER10"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to seller</Label>
                <Select
                  value={form.seller_id}
                  onValueChange={(v) =>
                    setForm({ ...form, seller_id: v, listing_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose seller" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name || s.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) =>
                    setForm({ ...form, discount_type: v as DiscountType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  placeholder={
                    form.discount_type === "percentage" ? "10" : "500"
                  }
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min order (Rs)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.min_order_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_order_amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max uses</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={form.max_uses}
                  onChange={(e) =>
                    setForm({ ...form, max_uses: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Per user limit</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={form.per_user_limit}
                  onChange={(e) =>
                    setForm({ ...form, per_user_limit: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm({ ...form, starts_at: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onValueChange={(v) =>
                  setForm({ ...form, scope: v as Scope, listing_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller_wide">
                    All items from this seller
                  </SelectItem>
                  <SelectItem value="item_based">
                    One specific listing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Single listing select — backend supports one listingId only */}
            {form.scope === "item_based" && (
              <div className="space-y-2">
                <Label>Applicable listing</Label>
                {!form.seller_id ? (
                  <p className="text-xs text-muted-foreground">
                    Pick a seller first.
                  </p>
                ) : listings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No approved listings for this seller.
                  </p>
                ) : (
                  <Select
                    value={form.listing_id}
                    onValueChange={(v) => setForm({ ...form, listing_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a listing" />
                    </SelectTrigger>
                    <SelectContent>
                      {listings.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                "Save Changes"
              ) : (
                "Create Coupon"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemptions dialog */}
      <Dialog
        open={!!redemptionsFor}
        onOpenChange={(o) => {
          if (!o) {
            setRedemptionsFor(null);
            setRedemptions([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Usage · <span className="font-mono">{redemptionsFor?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {redemptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No redemptions yet.
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.buyerId?.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.orderId?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        Rs {Number(r.discountAmount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerCoupons;
