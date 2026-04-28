import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBoostPackages, type BoostPackage, type BoostPlacement } from "@/hooks/useBoosts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, Sparkles, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const placementMeta: Record<BoostPlacement, { label: string; icon: any; color: string }> = {
  trending: { label: "Trending Now", icon: TrendingUp, color: "text-orange-500" },
  for_you: { label: "Picked for You", icon: Sparkles, color: "text-primary" },
  search: { label: "Search & Browse", icon: Search, color: "text-blue-500" },
};

interface Props {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

const BoostDialog = ({ listingId, listingTitle, trigger }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: packages = [], isLoading } = useBoostPackages();

  const togglePackage = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = packages
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + Number(p.price), 0);

  const purchase = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const chosen = packages.filter((p) => selected.has(p.id));
      const rows = chosen.map((p) => ({
        listing_id: listingId,
        seller_id: user.id,
        package_id: p.id,
        placement: p.placement,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + p.duration_days * 24 * 60 * 60 * 1000).toISOString(),
        price_paid: p.price,
        payment_status: "mock",
      }));
      const { error } = await supabase.from("listing_boosts" as any).insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Boost activated! (Mock payment)");
      queryClient.invalidateQueries({ queryKey: ["my-boosts"] });
      queryClient.invalidateQueries({ queryKey: ["active-boosts"] });
      setSelected(new Set());
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to activate boost"),
  });

  const grouped: Record<BoostPlacement, BoostPackage[]> = {
    trending: [],
    for_you: [],
    search: [],
  };
  for (const p of packages) grouped[p.placement].push(p);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1">
            <Rocket className="h-3.5 w-3.5" /> Boost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" /> Boost "{listingTitle}"
          </DialogTitle>
          <DialogDescription>
            Pick one or more à la carte placements. Boosted listings appear first in their section.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(grouped) as BoostPlacement[]).map((placement) => {
              const items = grouped[placement];
              if (items.length === 0) return null;
              const Meta = placementMeta[placement];
              const Icon = Meta.icon;
              return (
                <div key={placement}>
                  <h3 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground mb-3">
                    <Icon className={cn("h-4 w-4", Meta.color)} /> {Meta.label}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((p) => {
                      const isSelected = selected.has(p.id);
                      return (
                        <Card
                          key={p.id}
                          onClick={() => togglePackage(p.id)}
                          className={cn(
                            "cursor-pointer p-3 transition-all hover:border-primary/50",
                            isSelected && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {p.duration_days} days
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="secondary">€{Number(p.price).toFixed(2)}</Badge>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Total ({selected.size} selected)</p>
            <p className="font-heading text-2xl font-bold text-foreground">€{total.toFixed(2)}</p>
          </div>
          <Button
            disabled={selected.size === 0 || purchase.isPending}
            onClick={() => purchase.mutate()}
            className="gap-1"
          >
            {purchase.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Activate Boost (Mock)
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center -mt-1">
          Mock mode — no real payment is taken. Stripe will be enabled once your country is configured.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default BoostDialog;
