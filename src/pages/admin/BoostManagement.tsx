import type { BoostPackage, BoostPlacement, ListingBoost } from '@/types/boost';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getAdminBoostPackagesOptions,
  getAdminBoostsOptions,
  useUpdateBoostPackages,
} from '@/queries/useAdminBoost';

// ─── Constants ────────────────────────────────────────────────────────────────

const placementMeta: Record<
  BoostPlacement,
  { color: string; icon: any; label: string }
> = {
  FOR_YOU: { color: 'text-primary', icon: Sparkles, label: 'Picked for You' },
  SEARCH: { color: 'text-blue-500', icon: Search, label: 'Search & Browse' },
  TRENDING: {
    color: 'text-orange-500',
    icon: TrendingUp,
    label: 'Trending Now',
  },
};

// ─── Package Form ─────────────────────────────────────────────────────────────

interface PackageFormState {
  id?: string;
  active: boolean;
  credits: number;
  description: string;
  durationDays: number;
  name: string;
  placement: BoostPlacement;
  price: number;
}

const emptyPackage: PackageFormState = {
  active: true,
  credits: 0,
  description: '',
  durationDays: 7,
  name: '',
  placement: 'TRENDING',
  price: 500,
};

function PackageDialog({
  allPackages,
  initial,
  isPending,
  onSave,
  trigger,
}: {
  allPackages: BoostPackage[];
  initial?: PackageFormState;
  isPending: boolean;
  onSave: (packages: BoostPackage[]) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PackageFormState>(initial ?? emptyPackage);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (form.durationDays < 1) {
      toast.error('Duration must be at least 1 day');
      return;
    }
    if (form.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    const package_: BoostPackage = {
      id: form.id ?? (crypto.randomUUID()),
      active: form.active,
      credits: form.credits,
      description: form.description.trim(),
      durationDays: form.durationDays,
      name: form.name.trim(),
      placement: form.placement,
      price: form.price,
    };

    const updated = form.id
      ? allPackages.map(p => (p.id === form.id ? package_ : p))
      : [package_, ...allPackages];

    onSave(updated);
    setOpen(false);
    if (!form.id)
      setForm(emptyPackage);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {form.id ? 'Edit boost package' : 'New boost package'}
          </DialogTitle>
          <DialogDescription>
            Quick à la carte boost shown to sellers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              onChange={event => setForm({ ...form, name: event.target.value })}
              value={form.name}
              placeholder="Trending Boost — 7 days"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select
                onValueChange={v =>
                  setForm({ ...form, placement: v as BoostPlacement })}
                value={form.placement}
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
                  onCheckedChange={v => setForm({ ...form, active: v })}
                  checked={form.active}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Input
                onChange={event =>
                  setForm({
                    ...form,
                    durationDays: Math.max(1, Number(event.target.value) || 1),
                  })}
                value={form.durationDays}
                min={1}
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Price (PKR)</Label>
              <Input
                onChange={event =>
                  setForm({
                    ...form,
                    price: Math.max(0, Number(event.target.value) || 0),
                  })}
                value={form.price}
                min={0}
                step={1}
                type="number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              onChange={event =>
                setForm({ ...form, description: event.target.value })}
              value={form.description}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
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
}

// ─── Main Component ───────────────────────────────────────────────────────────

function BoostManagement() {
  const { data: packages = [], isLoading: packageLoading } = useQuery(
    getAdminBoostPackagesOptions(),
  );
  const updatePackages = useUpdateBoostPackages();

  const { data: boostsResponse, isLoading: boostLoading } = useQuery(
    getAdminBoostsOptions({ size: 100 }),
  );
  const boosts: ListingBoost[] = boostsResponse?.data ?? [];

  const handleSavePackages = (updated: BoostPackage[]) => {
    updatePackages.mutate(updated, {
      onError: (error: any) => toast.error(error.message ?? 'Failed to save'),
      onSuccess: () => toast.success('Package saved'),
    });
  };

  const handleDeletePackage = (id: string) => {
    handleSavePackages(packages.filter(p => p.id !== id));
    toast.success('Package deleted');
  };

  const now = useMemo(() => new Date(), []);
  const activeCount = boosts.filter(
    b =>
      new Date(b.endsAt) > now && ['PAID', 'MOCK'].includes(b.paymentStatus),
  ).length;
  const totalRevenue = boosts.reduce((s, b) => s + Number(b.pricePaid ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Paid Boosting
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage à la carte packages and monitor active campaigns.
          </p>
        </div>
        <PackageDialog
          onSave={handleSavePackages}
          allPackages={packages}
          isPending={updatePackages.isPending}
          trigger={(
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {' '}
              New package
            </Button>
          )}
        />
      </div>

      {/* Stats */}
      <div className="
        grid grid-cols-1 gap-3
        sm:grid-cols-3
      "
      >
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Active campaigns
          </p>
          <p className="font-heading text-2xl font-bold">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total campaigns
          </p>
          <p className="font-heading text-2xl font-bold">{boosts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Lifetime revenue
          </p>
          <p className="font-heading text-2xl font-bold">
            Rs
            {' '}
            {totalRevenue.toFixed(2)}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* ── Packages tab ── */}
        <TabsContent value="packages" className="pt-4">
          {packageLoading
            ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : (packages.length === 0
                ? (
                    <Card className="p-8 text-center text-sm text-muted-foreground">
                      No packages yet. Create the first one.
                    </Card>
                  )
                : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Placement</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[120px] text-right">
                              Actions
                            </TableHead>
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
                                    <Icon className={`
                                      h-3.5 w-3.5
                                      ${M.color}
                                    `}
                                    />
                                    {' '}
                                    {M.label}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {p.durationDays}
                                  {' '}
                                  days
                                </TableCell>
                                <TableCell>
                                  Rs
                                  {Number(p.price).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={p.active ? 'default' : 'secondary'}>
                                    {p.active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <PackageDialog
                                      onSave={handleSavePackages}
                                      allPackages={packages}
                                      initial={{
                                        id: p.id,
                                        active: p.active,
                                        credits: p.credits,
                                        description: p.description,
                                        durationDays: p.durationDays,
                                        name: p.name,
                                        placement: p.placement,
                                        price: Number(p.price),
                                      }}
                                      isPending={updatePackages.isPending}
                                      trigger={(
                                        <Button size="icon" variant="ghost">
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      )}
                                    />
                                    <Button
                                      onClick={() => handleDeletePackage(p.id)}
                                      disabled={updatePackages.isPending}
                                      size="icon"
                                      variant="ghost"
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
                  ))}
        </TabsContent>

        {/* ── Campaigns tab ── */}
        <TabsContent value="campaigns" className="pt-4">
          {boostLoading
            ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )
            : boostsResponse
              ? boosts.length === 0
                ? (
                    <Card className="p-8 text-center text-sm text-muted-foreground">
                      No campaigns have been launched yet.
                    </Card>
                  )
                : (
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
                            const isActive
                              = new Date(b.endsAt) > now
                                && ['PAID', 'MOCK'].includes(b.paymentStatus);
                            return (
                              <TableRow key={b.id}>
                                <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                                  {b.listingId.slice(0, 8)}
                                  …
                                </TableCell>
                                <TableCell className="max-w-[160px] truncate text-sm">
                                  {b.packageName ?? 'Custom campaign'}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center gap-1.5 text-sm">
                                    <Icon className={`
                                      h-3.5 w-3.5
                                      ${M.color}
                                    `}
                                    />
                                    {' '}
                                    {M.label}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {format(new Date(b.startsAt), 'MMM d')}
                                  {' '}
                                  →
                                  {' '}
                                  {format(new Date(b.endsAt), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  Rs
                                  {' '}
                                  {Number(b.pricePaid).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={isActive ? 'default' : 'secondary'}>
                                    {isActive
                                      ? 'Active'
                                      : (b.paymentStatus === 'CANCELLED'
                                          ? 'Cancelled'
                                          : 'Ended')}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  )
              : (
            // Admin boosts endpoint may not exist yet
                  <Card className="p-8 text-center text-sm text-muted-foreground">
                    Campaign data not available yet.
                  </Card>
                )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BoostManagement;
