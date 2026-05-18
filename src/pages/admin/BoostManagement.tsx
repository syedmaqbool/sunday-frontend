import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Pencil, Rocket, TrendingUp, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import type { BoostPackage, BoostPlacement, ListingBoost } from "@/hooks/useBoosts";
import { format } from "date-fns";

const placementMeta: Record<BoostPlacement, { label: string; icon: any; color: string }> = {
  trending: { label: "Trending Now", icon: TrendingUp, color: "text-orange-500" },
  for_you: { label: "Picked for You", icon: Sparkles, color: "text-primary" },
  search: { label: "Search & Browse", icon: Search, color: "text-blue-500" },
};

interface PackageFormState {
  id?: string;
  name: string;
  placement: BoostPlacement;
  duration_days: number;
  price: number;
  description: string;
  active: boolean;
}

const emptyPackage: PackageFormState = {
  name: "",
  placement: "trending",
  duration_days: 7,
  price: 9.99,
  description: "",
  active: true,
};

const PackageDialog = ({
  initial,
  trigger,
}: {
  initial?: PackageFormState;
  trigger: React.ReactNode;
}) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PackageFormState>(initial ?? emptyPackage);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      if (form.duration_days < 1) throw new Error("Duration must be at least 1 day");
      if (form.price < 0) throw new Error("Price cannot be negative");

      const payload = {
        name: form.name,
        placement: form.placement,
        duration_days: form.duration_days,
        price: form.price,
        description: form.description,
        active: form.active,
      };

      if (form.id) {
        const { error } = await supabase
          .from("boost_packages" as any)
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("boost_packages" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Package updated" : "Package created");
      qc.invalidateQueries({ queryKey: ["admin-boost-packages"] });
      qc.invalidateQueries({ queryKey: ["boost-packages"] });
      setOpen(false);
      if (!form.id) setForm(emptyPackage);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit boost package" : "New boost package"}</DialogTitle>
          <DialogDescription>
            Quick à la carte boost shown to sellers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Trending Boost — 7 days"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select
                value={form.placement}
                onValueChange={(v) => setForm({ ...form, placement: v as BoostPlacement })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending Now</SelectItem>
                  <SelectItem value="for_you">Picked for You</SelectItem>
                  <SelectItem value="search">Search & Browse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Active</Label>
              <div className="flex h-10 items-center">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Input
                type="number"
                min={1}
                value={form.duration_days}
                onChange={(e) =>
                  setForm({ ...form, duration_days: Math.max(1, Number(e.target.value) || 1) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Price (PKR)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BoostManagement = () => {
  const qc = useQueryClient();

  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ["admin-boost-packages"],
    queryFn: async (): Promise<BoostPackage[]> => {
      const { data, error } = await supabase
        .from("boost_packages" as any)
        .select("*")
        .order("placement")
        .order("duration_days");
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  const { data: boosts = [], isLoading: boostLoading } = useQuery({
    queryKey: ["admin-all-boosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_boosts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any[]) as ListingBoost[];
    },
  });

  // Fetch listing titles + seller names for displayed boosts
  const listingIds = useMemo(() => [...new Set(boosts.map((b) => b.listing_id))], [boosts]);
  const sellerIds = useMemo(() => [...new Set(boosts.map((b) => b.seller_id))], [boosts]);

  const { data: listingMap = {} } = useQuery({
    queryKey: ["admin-boost-listings", listingIds],
    enabled: listingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title")
        .in("id", listingIds);
      if (error) throw error;
      const m: Record<string, string> = {};
      (data ?? []).forEach((l: any) => (m[l.id] = l.title));
      return m;
    },
  });

  const { data: sellerMap = {} } = useQuery({
    queryKey: ["admin-boost-sellers", sellerIds],
    enabled: sellerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", sellerIds);
      if (error) throw error;
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => (m[p.id] = p.full_name ?? "—"));
      return m;
    },
  });

  const deletePkg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boost_packages" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Package deleted");
      qc.invalidateQueries({ queryKey: ["admin-boost-packages"] });
      qc.invalidateQueries({ queryKey: ["boost-packages"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  const cancelBoost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("listing_boosts" as any)
        .update({ ends_at: new Date().toISOString(), payment_status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign cancelled");
      qc.invalidateQueries({ queryKey: ["admin-all-boosts"] });
      qc.invalidateQueries({ queryKey: ["active-boosts"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to cancel"),
  });

  const now = new Date();
  const activeCount = boosts.filter(
    (b) => new Date(b.ends_at) > now && ["paid", "mock"].includes(b.payment_status),
  ).length;
  const totalRevenue = boosts.reduce((s, b) => s + Number(b.price_paid ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Paid Boosting</h2>
          <p className="text-sm text-muted-foreground">
            Manage à la carte packages and monitor active campaigns.
          </p>
        </div>
        <PackageDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New package
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active campaigns</p>
          <p className="font-heading text-2xl font-bold">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total campaigns</p>
          <p className="font-heading text-2xl font-bold">{boosts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Lifetime revenue</p>
          <p className="font-heading text-2xl font-bold">Rs {totalRevenue.toFixed(2)}</p>
        </Card>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="pt-4">
          {pkgLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : packages.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No packages yet. Create the first one.
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((p) => {
                    const M = placementMeta[p.placement];
                    const Icon = M.icon;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {p.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Icon className={`h-3.5 w-3.5 ${M.color}`} /> {M.label}
                          </span>
                        </TableCell>
                        <TableCell>{p.duration_days} days</TableCell>
                        <TableCell>Rs {Number(p.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={p.active ? "default" : "secondary"}>
                            {p.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <PackageDialog
                              initial={{
                                id: p.id,
                                name: p.name,
                                placement: p.placement,
                                duration_days: p.duration_days,
                                price: Number(p.price),
                                description: p.description,
                                active: p.active,
                              }}
                              trigger={
                                <Button size="icon" variant="ghost">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Delete "${p.name}"?`)) deletePkg.mutate(p.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="pt-4">
          {boostLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : boosts.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No campaigns have been launched yet.
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boosts.map((b) => {
                    const M = placementMeta[b.placement];
                    const Icon = M.icon;
                    const isActive =
                      new Date(b.ends_at) > now &&
                      ["paid", "mock"].includes(b.payment_status);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="max-w-[220px] truncate">
                          {listingMap[b.listing_id] ?? b.listing_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {sellerMap[b.seller_id] ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Icon className={`h-3.5 w-3.5 ${M.color}`} /> {M.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(b.starts_at), "MMM d")} →{" "}
                          {format(new Date(b.ends_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>Rs {Number(b.price_paid).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Active" : b.payment_status === "cancelled" ? "Cancelled" : "Ended"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Cancel this campaign now?")) cancelBoost.mutate(b.id);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BoostManagement;
