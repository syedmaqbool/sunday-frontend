import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CONDITIONS, SORT_OPTIONS, MOCK_LISTINGS, SIZES } from "@/lib/constants";
import { useCategories, useSubcategories } from "@/hooks/useCategories";
import { Search, Grid3X3, List, SlidersHorizontal, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@/lib/constants";
import { useUserPreferences, personalizeListings } from "@/hooks/useUserPreferences";
import { useSellerRatings } from "@/hooks/useSellerRating";

const fetchListings = async (): Promise<Listing[]> => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const dbListings: Listing[] = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"],
    category: row.category,
    condition: row.condition,
    size: row.size,
    brand: row.brand,
    seller_id: row.seller_id,
    seller_name: "Seller",
    created_at: row.created_at,
    status: row.status,
  }));

  return [...dbListings, ...MOCK_LISTINGS];
};

const Listings = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const initialCategory = searchParams.get("category") || "all";
  const initialParent = searchParams.get("parent") || (initialCategory !== "all" ? initialCategory.split("-")[0] : "all");
  const initialSub = initialCategory !== "all" && initialCategory.includes("-") ? initialCategory.split("-")[1] : "all";

  const [parentCat, setParentCat] = useState(initialParent);
  const [subCat, setSubCat] = useState(initialSub);
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const { data: prefs } = useUserPreferences();
  const { data: parentCategories = [] } = useCategories();
  const { data: subCategoriesList = [] } = useSubcategories();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });

  const sellerIds = useMemo(() => listings.map((l) => l.seller_id), [listings]);
  const { data: sellerRatingsMap } = useSellerRatings(sellerIds);

  const filtered = useMemo(() => {
    let items = [...listings];
    if (search) items = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()));
    if (parentCat !== "all") {
      items = items.filter(i => i.category.startsWith(parentCat + "-"));
    }
    if (subCat !== "all") {
      items = items.filter(i => i.category.endsWith("-" + subCat));
    }
    if (condition !== "all") items = items.filter(i => i.condition === condition);
    if (sort === "price_asc") items.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") items.sort((a, b) => b.price - a.price);
    else {
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      items = personalizeListings(items, prefs);
    }
    return items;
  }, [listings, search, parentCat, subCat, condition, sort, prefs]);

  const filterSelects = (
    <>
      <Select value={parentCat} onValueChange={v => { setParentCat(v); if (v === "all") setSubCat("all"); }}>
        <SelectTrigger className="w-[130px]"><SelectValue placeholder="Gender" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {parentCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={subCat} onValueChange={setSubCat}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {subCategoriesList.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={condition} onValueChange={setCondition}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Condition" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Conditions</SelectItem>
          {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or brand..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 md:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
            <div className="hidden gap-2 md:flex">
              {filterSelects}
            </div>
            <div className="flex rounded-md border border-border">
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-none rounded-l-md" onClick={() => setView("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-none rounded-r-md" onClick={() => setView("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 md:hidden">
            {filterSelects}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">{filtered.length} items</p>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="font-heading text-2xl font-semibold text-foreground">No items found</p>
                <p className="mt-2 text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : view === "grid" ? (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((l, i) => <ListingCard key={l.id} listing={l} index={i} sellerRating={sellerRatingsMap?.get(l.seller_id)} />)}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filtered.map(l => (
                  <div key={l.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                    <img src={l.images[0]} alt={l.title} className="h-28 w-28 rounded-md object-cover" />
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{l.brand}</p>
                      <h3 className="text-sm font-semibold text-card-foreground">{l.title}</h3>
                      <p className="mt-1 text-sm font-bold text-card-foreground">R {l.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Size {l.size} · {l.condition.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Listings;
