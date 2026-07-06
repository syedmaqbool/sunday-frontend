import { useQuery } from '@tanstack/react-query';
import {
  Grid3X3,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { applyBoostRanking, useBoostScoreMap } from '@/hooks/useBoosts';
import { getCategoriesOptions, getSubcategoriesOptions } from '@/hooks/useCategories';
import { getSellerRatingsOptions } from '@/hooks/useSellerRating';
import {
  getUserPreferencesOptions,
  personalizeListings,
} from '@/hooks/useUserPreferences';
import { CONDITIONS, SIZES, SORT_OPTIONS } from '@/lib/constants';
import {
  getListingMediaUrls,
  getMarketplaceListingsOptions,
} from '@/queries/marketplace.query';

function Listings() {
  const [searchParameters] = useSearchParams();
  const [search, setSearch] = useState(searchParameters.get('search') || '');
  const initialCategory = searchParameters.get('category') || 'all';
  const initialParent
    = searchParameters.get('parent')
      || (initialCategory === 'all' ? 'all' : initialCategory.split('-', 1)[0]);
  const initialSub
    = initialCategory !== 'all' && initialCategory.includes('-')
      ? initialCategory.split('-', 2)[1]
      : 'all';

  const [parentCat, setParentCat] = useState(initialParent);
  const [subCat, setSubCat] = useState(initialSub);
  const [condition, setCondition] = useState('all');
  const [size, setSize] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { data: prefs } = useQuery(getUserPreferencesOptions());
  const { data: parentCategories = [] } = useQuery(getCategoriesOptions());
  const { data: subCategoriesList = [] } = useQuery(getSubcategoriesOptions());

  const { data: listings = [], isLoading } = useQuery(getMarketplaceListingsOptions());

  const sellerIds = useMemo(() => listings.map(l => l.sellerId), [listings]);
  const { data: sellerRatingsMap } = useQuery(getSellerRatingsOptions(sellerIds));
  const searchBoostMap = useBoostScoreMap('SEARCH');

  useEffect(() => {
    const category = searchParameters.get('category') || 'all';
    const parent
      = searchParameters.get('parent')
        || (category === 'all' ? 'all' : category.split('-', 1)[0]);
    const sub
      = category !== 'all' && category.includes('-')
        ? category.split('-', 2)[1]
        : 'all';

    setParentCat(parent);
    setSubCat(sub);
  }, [searchParameters]);

  const filtered = useMemo(() => {
    let items = [...listings];
    if (search) {
      items = items.filter(
        index =>
          index.title.toLowerCase().includes(search.toLowerCase())
          || index.brand.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (parentCat !== 'all') {
      items = items.filter(
        index => index.categoryValue.toLowerCase().split('-', 1)[0] === parentCat.toLowerCase(),
      );
    }

    if (subCat !== 'all') {
      items = items.filter(index => index.categoryValue.endsWith(`-${subCat}`));
    }
    if (condition !== 'all')
      items = items.filter(index => index.condition === condition);
    if (size !== 'all')
      items = items.filter(index => index.size === size);
    if (sort === 'price_asc') {
      items.sort((a, b) => a.price - b.price);
    }
    else if (sort === 'price_desc') {
      items.sort((a, b) => b.price - a.price);
    }
    else {
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      items = personalizeListings(items, prefs, item => item.categoryValue);
    }
    // Boosted listings always surface first within the current sort
    items = applyBoostRanking(items, searchBoostMap);
    return items;
  }, [
    listings,
    search,
    parentCat,
    subCat,
    condition,
    size,
    sort,
    prefs,
    searchBoostMap,
  ]);

  const filterSelects = (
    <>
      <Select
        onValueChange={(v) => {
          setParentCat(v);
          if (v === 'all')
            setSubCat('all');
        }}
        value={parentCat}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {parentCategories.map(c => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setSubCat} value={subCat}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {subCategoriesList.map(c => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setCondition} value={condition}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Condition" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Conditions</SelectItem>
          {CONDITIONS.map(c => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setSize} value={size}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          {SIZES.map(s => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setSort} value={sort}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map(s => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <div className="
          flex flex-col gap-4
          md:flex-row md:items-center md:justify-between
        "
        >
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              onChange={event => setSearch(event.target.value)}
              value={search}
              placeholder="Search by name or brand..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
              variant="outline"
              className="
                gap-1
                md:hidden
              "
            >
              <SlidersHorizontal className="h-4 w-4" />
              {' '}
              Filters
            </Button>
            <div className="
              hidden gap-2
              md:flex
            "
            >
              {filterSelects}
            </div>
            <div className="flex rounded-md border border-border">
              <Button
                onClick={() => setView('grid')}
                size="icon"
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                className="h-8 w-8 rounded-none rounded-l-md"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setView('list')}
                size="icon"
                variant={view === 'list' ? 'secondary' : 'ghost'}
                className="h-8 w-8 rounded-none rounded-r-md"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="
            mt-4 flex flex-wrap gap-2
            md:hidden
          "
          >
            {filterSelects}
          </div>
        )}

        {isLoading
          ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : (
              <>
                <p className="mt-6 text-sm text-muted-foreground">
                  {filtered.length}
                  {' '}
                  items
                </p>
                {filtered.length === 0
                  ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="font-heading text-2xl font-semibold text-foreground">
                          No items found
                        </p>
                        <p className="mt-2 text-muted-foreground">
                          Try adjusting your filters
                        </p>
                      </div>
                    )
                  : (view === 'grid'
                      ? (
                          <div className="
                            mt-4 grid grid-cols-2 gap-4
                            sm:grid-cols-3
                            lg:grid-cols-4
                          "
                          >
                            {filtered.map((l, index) => (
                              <ListingCard
                                key={l.id}
                                index={index}
                                listing={l}
                                sellerRating={sellerRatingsMap?.get(l.sellerId)}
                              />
                            ))}
                          </div>
                        )
                      : (
                          <div className="mt-4 space-y-4">
                            {filtered.map((l) => {
                              const mediaUrls = getListingMediaUrls(l);
                              return (
                                <div
                                  key={l.id}
                                  className="flex gap-4 rounded-lg border border-border bg-card p-4"
                                >
                                  <img
                                    src={mediaUrls[0]}
                                    alt={l.title}
                                    className="h-28 w-28 rounded-md object-cover"
                                  />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                      {l.brand}
                                    </p>
                                    <h3 className="text-sm font-semibold text-card-foreground">
                                      {l.title}
                                    </h3>
                                    <p className="mt-1 text-sm font-bold text-card-foreground">
                                      Rs
                                      {' '}
                                      {l.price.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Size
                                      {' '}
                                      {l.size}
                                      {' '}
                                      ·
                                      {' '}
                                      {l.condition.replace('_', ' ')}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
              </>
            )}
      </main>
      <Footer />
    </div>
  );
}

export default Listings;
