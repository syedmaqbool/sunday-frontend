import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ListingModeration = () => {
  const [filter, setFilter] = useState("pending");
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-listings", filter],
    queryFn: async () => {
      let q = supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("listings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(`Listing ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to update listing"),
  });

  const statusColor = (s: string) => {
    if (s === "approved") return "default";
    if (s === "rejected") return "destructive";
    return "secondary";
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Listing Moderation</h1>
          <p className="mt-1 text-muted-foreground">Approve or reject submitted listings</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-8 text-center text-muted-foreground">No listings found</div>
      ) : (
        <div className="mt-6 space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <img
                  src={listing.images?.[0] || "/placeholder.svg"}
                  alt={listing.title}
                  className="h-20 w-20 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{listing.title}</h3>
                    <Badge variant={statusColor(listing.status)}>{listing.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing.brand} · {listing.category} · R {listing.price.toLocaleString()}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{listing.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {listing.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-primary"
                      onClick={() => updateStatus.mutate({ id: listing.id, status: "approved" })}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {listing.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                      onClick={() => updateStatus.mutate({ id: listing.id, status: "rejected" })}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingModeration;
