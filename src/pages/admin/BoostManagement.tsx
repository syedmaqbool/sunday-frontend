import { useMemo, useState } from "react";
import { useBoostPackages, useUpdateBoostPackages, useAdminBoosts } from "@/queries/useAdminBoost";
import type { BoostPackage, BoostPlacement, ListingBoost } from "@/services/adminBoost.service";
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
import { Loader2, Plus, Trash2, Pencil, TrendingUp, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nanoid } from "nanoid"; // or use crypto.randomUUID()

// ─── Constants ────────────────────────────────────────────────────────────────

const placementMeta: Record<BoostPlacement, { label: string; icon: any; color: string }> = {
  TRENDING: { label: "Trending Now", icon: TrendingUp, color: "text-orange-500" },
  FOR_YOU: { label: "Picked for You", icon: Sparkles, color: "text-primary" },
  SEARCH: { label: "Search & Browse", icon: Search, color: "text-blue-500" },
};

// ─── Package Form ─────────────────────────────────────────────────────────────

interface PackageFormState {
  id?: string;
  name: string;
  placement: BoostPlacement;
  durationDays: number;
  credits: number;
  price: number;
  description: string;
  active: boolean;
}

const emptyPackage: PackageFormState = {
  name: "",
  placement: "TRENDING",
  durationDays: 7,
  credits: 0,
  price: 500,
  description: "",
  active: true,
};

const PackageDialog = ({
  initial,
  trigger,
  allPackages,
  onSave,
  isPending,
}: {
  initial?: PackageFormState;
  trigger: React.ReactNode;
  allPackages: BoostPackage[];
  onSave: (packages: BoostPackage[]) => void;
  isPending: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PackageFormState>(initial ?? emptyPackage);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (form.durationDays < 1) { toast.error("Duration must be at least 1 day"); return; }
    if (form.price < 0) { toast.error("Price cannot be negative"); return; }

    const pkg: BoostPackage = {
      id: form.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : nanoid()),
      name: form.name.trim(),
      placement: form.placement,
      durationDays: form.durationDays,
      credits: form.credits,
      price: form.price,
      description: form.description.trim(),
      active: form.active,
    };

    const updated = form.id
      ? allPackages.map((p) => (p.id === form.id ? pkg : p))
      : [pkg, ...allPackages];

    onSave(updated);
    setOpen(false);
    if (!form.id) setForm(emptyPackage);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit boost package" : "New boost package"}</DialogTitle>
          <DialogDescription>Quick à la carte boost shown to sellers.</DialogDescription>
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
                  <SelectItem value="TRENDING">Trending Now</SelectItem>
                  <SelectItem value="FOR_YOU">Picked for You</SelectItem>
                  <SelectItem value="SEARCH">Search &amp; Browse</SelectItem>
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
                value={form.durationDays}
                onChange={(e) =>
                  setForm({ ...form, durationDays: Math.max(1, Number(e.target.value) || 1) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Price (PKR)</Label>
              <Input
                type="number"
                min={0}
                step={1}
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
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BoostManagement = () => {
  const { data: packages = [], isLoading: pkgLoading } = useBoostPackages();
  const updatePackages = useUpdateBoostPackages();

  const { data: boostsResponse, isLoading: boostLoading } = useAdminBoosts({ size: 100 });
  const boosts: ListingBoost[] = boostsResponse?.data ?? [];

  const handleSavePackages = (updated: BoostPackage[]) => {
    updatePackages.mutate(updated, {
      onSuccess: () => toast.success("Package saved"),
      onError: (e: any) => toast.error(e.message ?? "Failed to save"),
    });
  };

  const handleDeletePackage = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    handleSavePackages(packages.filter((p) => p.id !== id));
    toast.success("Package deleted");
  };

  const now = new Date();
  const activeCount = boosts.filter(
    (b) => new Date(b.endsAt) > now && ["PAID", "MOCK"].includes(b.paymentStatus),
  ).length;
  const totalRevenue = boosts.reduce((s, b) => s + Number(b.pricePaid ?? 0), 0);

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
          allPackages={packages}
          onSave={handleSavePackages}
          isPending={updatePackages.isPending}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New package
            </Button>
          }
        />
      </div>

      {/* Stats */}
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

        {/* ── Packages tab ── */}
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
                        <TableCell>{p.durationDays} days</TableCell>
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
                                durationDays: p.durationDays,
                                credits: p.credits,
                                price: Number(p.price),
                                description: p.description,
                                active: p.active,
                              }}
                              allPackages={packages}
                              onSave={handleSavePackages}
                              isPending={updatePackages.isPending}
                              trigger={
                                <Button size="icon" variant="ghost">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeletePackage(p.id, p.name)}
                              disabled={updatePackages.isPending}
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

        {/* ── Campaigns tab ── */}
        <TabsContent value="campaigns" className="pt-4">
          {boostLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !boostsResponse ? (
            // Admin boosts endpoint may not exist yet
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Campaign data not available yet.
            </Card>
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
                    <TableHead>Package</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boosts.map((b) => {
                    const M = placementMeta[b.placement];
                    const Icon = M.icon;
                    const isActive =
                      new Date(b.endsAt) > now &&
                      ["PAID", "MOCK"].includes(b.paymentStatus);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                          {b.listingId.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm">
                          {b.packageName ?? "Custom campaign"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Icon className={`h-3.5 w-3.5 ${M.color}`} /> {M.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(b.startsAt), "MMM d")} →{" "}
                          {format(new Date(b.endsAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>Rs {Number(b.pricePaid).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive
                              ? "Active"
                              : b.paymentStatus === "CANCELLED"
                              ? "Cancelled"
                              : "Ended"}
                          </Badge>
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