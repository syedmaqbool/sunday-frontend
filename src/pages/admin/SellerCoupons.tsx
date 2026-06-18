import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Trash2, Tag, Pencil, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

type DiscountType = "percentage" | "fixed";
type Scope = "seller_wide" | "item_based";

interface SellerCoupon {
  id: string;
  code: string;
  seller_id: string;
  description: string | null;
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
  seller_name?: string | null;
}

interface SellerOption {
  id: string;
  full_name: string | null;
}

interface ListingOption {
  id: string;
  title: string;
  seller_id: string;
}

const emptyForm = {
  code: "",
  description: "",
  seller_id: "",
  discount_type: "percentage" as DiscountType,
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  per_user_limit: "",
  scope: "seller_wide" as Scope,
  starts_at: "",
  expires_at: "",
  listing_ids: [] as string[],
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SELLER_OPTIONS: SellerOption[] = [
  { id: "mock-user-id", full_name: "Muhamad Bilal Shaikh" },
  { id: "mock-seller-id", full_name: "Premium Thrifter" },
  { id: "mock-seller-id-2", full_name: "Closet Curator" },
];

const MOCK_SELLER_LISTINGS: ListingOption[] = [
  { id: "mock-listing-1", title: "Vintage Leather Jacket", seller_id: "mock-seller-id" },
  { id: "mock-listing-3", title: "Bohemian Summer Dress", seller_id: "mock-user-id" },
  { id: "mock-listing-5", title: "Wool Winter Coat", seller_id: "mock-user-id" },
  { id: "mock-listing-2", title: "Classic White Sneakers", seller_id: "mock-seller-id-2" },
];

let mockCouponsStore: SellerCoupon[] = [
  {
    id: "coupon-1",
    code: "WELCOME10",
    seller_id: "mock-seller-id",
    description: "Welcome discount for new buyers",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 2000,
    max_uses: 100,
    current_uses: 23,
    per_user_limit: 1,
    scope: "seller_wide",
    starts_at: null,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "coupon-2",
    code: "JACKET500",
    seller_id: "mock-user-id",
    description: "Flat discount on selected items",
    discount_type: "fixed",
    discount_value: 500,
    min_order_amount: 0,
    max_uses: 50,
    current_uses: 5,
    per_user_limit: null,
    scope: "item_based",
    starts_at: null,
    expires_at: null,
    active: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let mockCouponListingsStore: Record<string, string[]> = {
  "coupon-2": ["mock-listing-3", "mock-listing-5"],
};

let mockRedemptionsStore: Record<string, any[]> = {
  "coupon-1": [
    { id: "rd-1", user_id: "mock-buyer-2", order_id: "ord-1029ab", discount_amount: 350, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "rd-2", user_id: "mock-buyer-3", order_id: "ord-77baad", discount_amount: 280, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  "coupon-2": [],
};

// ─── Component ────────────────────────────────────────────────────────────────

const SellerCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [redemptionsFor, setRedemptionsFor] = useState<SellerCoupon | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      const sellerMap = new Map(MOCK_SELLER_OPTIONS.map((p) => [p.id, p.full_name]));
      setSellers(MOCK_SELLER_OPTIONS);
      setCoupons(
        mockCouponsStore.map((c) => ({
          ...c,
          seller_name: sellerMap.get(c.seller_id) ?? "—",
        })),
      );
      setLoading(false);
      return;
    }

    const [{ data: cps }, { data: prof }] = await Promise.all([
      supabase
        .from("seller_coupons" as any)
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);
    const sellerMap = new Map((prof ?? []).map((p: any) => [p.id, p.full_name]));
    setSellers(((prof ?? []) as any[]).map((p) => ({ id: p.id, full_name: p.full_name })));
    setCoupons(
      ((cps ?? []) as any[]).map((c) => ({
        ...c,
        discount_value: Number(c.discount_value),
        min_order_amount: Number(c.min_order_amount || 0),
        seller_name: sellerMap.get(c.seller_id) ?? "—",
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Load listings for selected seller (item-based scope)
  useEffect(() => {
    if (!form.seller_id || form.scope !== "item_based") {
      setListings([]);
      return;
    }

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      setListings(MOCK_SELLER_LISTINGS.filter((l) => l.seller_id === form.seller_id));
      return;
    }

    supabase
      .from("listings")
      .select("id, title, seller_id")
      .eq("seller_id", form.seller_id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings((data ?? []) as ListingOption[]));
  }, [form.seller_id, form.scope]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (c: SellerCoupon) => {
    let linkedIds: string[] = [];

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      linkedIds = mockCouponListingsStore[c.id] ?? [];
    } else {
      const { data: links } = await supabase
        .from("seller_coupon_listings" as any)
        .select("listing_id")
        .eq("coupon_id", c.id);
      linkedIds = ((links ?? []) as any[]).map((l) => l.listing_id);
    }

    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      seller_id: c.seller_id,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "",
      max_uses: c.max_uses !== null ? String(c.max_uses) : "",
      per_user_limit: c.per_user_limit !== null ? String(c.per_user_limit) : "",
      scope: c.scope,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
      listing_ids: linkedIds,
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
    if (form.scope === "item_based" && form.listing_ids.length === 0) {
      toast({
        title: "Select listings",
        description: "Item-based coupons need at least one listing.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      seller_id: form.seller_id,
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
      scope: form.scope,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
    };

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      let couponId = editingId;
      if (editingId) {
        mockCouponsStore = mockCouponsStore.map((c) =>
          c.id === editingId ? { ...c, ...payload } : c,
        );
        delete mockCouponListingsStore[editingId];
      } else {
        couponId = `mock-coupon-${Date.now()}`;
        mockCouponsStore = [
          { ...payload, id: couponId, current_uses: 0, created_at: new Date().toISOString() },
          ...mockCouponsStore,
        ];
      }
      if (form.scope === "item_based" && couponId) {
        mockCouponListingsStore[couponId] = [...form.listing_ids];
      }
      setSaving(false);
      setDialogOpen(false);
      resetForm();
      fetchAll();
      toast({ title: editingId ? "Coupon updated" : "Coupon created" });
      return;
    }

    let couponId = editingId;
    if (editingId) {
      const { error } = await supabase
        .from("seller_coupons" as any)
        .update(payload)
        .eq("id", editingId);
      if (error) {
        setSaving(false);
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
        return;
      }
      await supabase.from("seller_coupon_listings" as any).delete().eq("coupon_id", editingId);
    } else {
      payload.created_by = user?.id ?? null;
      const { data, error } = await supabase
        .from("seller_coupons" as any)
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) {
        setSaving(false);
        toast({ title: "Create failed", description: error?.message, variant: "destructive" });
        return;
      }
      couponId = (data as any).id;
    }

    if (form.scope === "item_based" && couponId) {
      const rows = form.listing_ids.map((listing_id) => ({
        coupon_id: couponId,
        listing_id,
      }));
      await supabase.from("seller_coupon_listings" as any).insert(rows);
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchAll();
    toast({ title: editingId ? "Coupon updated" : "Coupon created" });
  };

  const toggleActive = async (c: SellerCoupon) => {
    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      mockCouponsStore = mockCouponsStore.map((x) =>
        x.id === c.id ? { ...x, active: !x.active } : x,
      );
      fetchAll();
      return;
    }
    await supabase
      .from("seller_coupons" as any)
      .update({ active: !c.active })
      .eq("id", c.id);
    fetchAll();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon? Redemption history will be removed.")) return;

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      mockCouponsStore = mockCouponsStore.filter((c) => c.id !== id);
      delete mockCouponListingsStore[id];
      delete mockRedemptionsStore[id];
      fetchAll();
      toast({ title: "Coupon deleted" });
      return;
    }

    await supabase.from("seller_coupons" as any).delete().eq("id", id);
    fetchAll();
    toast({ title: "Coupon deleted" });
  };

  const openRedemptions = async (c: SellerCoupon) => {
    setRedemptionsFor(c);

    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      setRedemptions(mockRedemptionsStore[c.id] ?? []);
      return;
    }

    const { data } = await supabase
      .from("seller_coupon_redemptions" as any)
      .select("id, user_id, order_id, discount_amount, created_at")
      .eq("coupon_id", c.id)
      .order("created_at", { ascending: false });
    setRedemptions((data ?? []) as any[]);
  };

  const sellerLabel = useMemo(
    () => (id: string) => sellers.find((s) => s.id === id)?.full_name ?? id.slice(0, 8),
    [sellers],
  );

  if (loading) {
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Seller Coupons</h1>
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
                  <TableCell className="font-mono font-semibold text-foreground">{c.code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.seller_name}</TableCell>
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
                    {c.scope === "seller_wide" ? "All seller items" : "Specific items"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                    {" → "}
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.current_uses}
                    {c.max_uses !== null ? ` / ${c.max_uses}` : ""}
                    {c.per_user_limit ? ` · ${c.per_user_limit}/user` : ""}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
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
            <DialogTitle>{editingId ? "Edit Coupon" : "Create Seller Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="SELLER10"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to seller</Label>
                <Select
                  value={form.seller_id}
                  onValueChange={(v) => setForm({ ...form, seller_id: v, listing_ids: [] })}
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

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Internal note about this promotion"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) => setForm({ ...form, discount_type: v as DiscountType })}
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
                  placeholder={form.discount_type === "percentage" ? "10" : "500"}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max uses</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Per user limit</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={form.per_user_limit}
                  onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onValueChange={(v) => setForm({ ...form, scope: v as Scope, listing_ids: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller_wide">All items from this seller</SelectItem>
                  <SelectItem value="item_based">Specific listings only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.scope === "item_based" && (
              <div className="space-y-2">
                <Label>Applicable listings</Label>
                {!form.seller_id ? (
                  <p className="text-xs text-muted-foreground">Pick a seller first.</p>
                ) : listings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No approved listings for this seller.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded border border-border p-2 space-y-2">
                    {listings.map((l) => {
                      const checked = form.listing_ids.includes(l.id);
                      return (
                        <label
                          key={l.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setForm({
                                ...form,
                                listing_ids: v
                                  ? [...form.listing_ids, l.id]
                                  : form.listing_ids.filter((x) => x !== l.id),
                              })
                            }
                          />
                          <span className="truncate">{l.title}</span>
                        </label>
                      );
                    })}
                  </div>
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
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{r.user_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{r.order_id?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        Rs {Number(r.discount_amount).toLocaleString()}
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