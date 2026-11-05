import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Grid3X3, List, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import Navbar from '@/components/Navbar';
import SellerByline from '@/components/SellerByline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoriesOptions, getSubcategoriesOptions } from '@/hooks/useCategories';
import { getSellerRatingsOptions } from '@/hooks/useSellerRating';
import { CONDITIONS, SIZES, SORT_OPTIONS } from '@/lib/constants';
import { formatEnumLabel } from '@/lib/utilities';
import { getClothingTypesOptions } from '@/queries/clothing-types.query';
import { getListingMediaUrls, getMarketplaceListingsOptions } from '@/queries/marketplace.query';

function Listings() {
  const [searchParameters] = useSearchParams();
  const [search, setSearch] = useState(searchParameters.get('search') || '');
  const initialCategory = searchParameters.get('category') || 'all';
  const initialParent =
    searchParameters.get('parent') ||
    (initialCategory === 'all' ? 'all' : initialCategory.split('-', 1)[0]);
  const initialSub =
    initialCategory !== 'all' && initialCategory.includes('-')
      ? initialCategory.split('-', 2)[1]
      : 'all';
  const initialClothingType = searchParameters.get('clothing_type') || 'all';

  const [parentCat, setParentCat] = useState(initialParent);
  const [subCat, setSubCat] = useState(initialSub);
  const [clothingType, setClothingType] = useState(
    initialSub === 'clothes' ? initialClothingType : 'all',
  );
  const [condition, setCondition] = useState('all');
  const [size, setSize] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const { loading: authLoading, user } = useAuth();
  const { data: parentCategories = [] } = useQuery(getCategoriesOptions());
  const selectedParentCategoryId = parentCategories.find(
    category => category.value === parentCat,
  )?.id;
  const { data: subCategoryPages = [] } = useQuery(
    getSubcategoriesOptions(selectedParentCategoryId),
  );
  const subCategoriesList = subCategoryPages.flatMap(page => page.data);
  const { data: clothingTypePages = [], isSuccess: clothingTypesLoaded } =
    useQuery(getClothingTypesOptions());
  const clothingTypes = clothingTypePages.flatMap(page => page.data);
  const selectedClothingTypeId = clothingTypes.find(type => type.value === clothingType)?.id;

  const listingParameters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      categoryValue: parentCat === 'all' ? undefined : parentCat,
      subcategoryValue: subCat === 'all' ? undefined : subCat,
      clothingTypeId: selectedClothingTypeId,
      condition: condition === 'all' ? undefined : condition,
      sizeValue: size === 'all' ? undefined : size,
      sortBy: sort === 'newest' ? ('createdAt' as const) : ('price' as const),
      sortOrder: sort === 'price_asc' ? ('asc' as const) : ('desc' as const),
    }),
    [condition, debouncedSearch, parentCat, selectedClothingTypeId, size, sort, subCat],
  );
  const {
    data: listingPages,
    isLoading,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    getMarketplaceListingsOptions(
      listingParameters,
      user?.id,
      !authLoading && (clothingType === 'all' || !!selectedClothingTypeId),
    ),
  );
  const listings = useMemo(
    () => listingPages?.pages.flatMap(page => page.data) ?? [],
    [listingPages],
  );
  const totalListings = listingPages?.pages.at(-1)?.pagination.total ?? 0;
  const loadMoreElement = useRef<HTMLDivElement>(null);
  const previousListingParameters = useRef<string>();

  const sellerIds = useMemo(() => listings.map(l => l.sellerId), [listings]);
  const { data: sellerRatingsMap } = useQuery(getSellerRatingsOptions(sellerIds));
  useEffect(() => {
    const category = searchParameters.get('category') || 'all';
    const parent =
      searchParameters.get('parent') || (category === 'all' ? 'all' : category.split('-', 1)[0]);
    const sub = category !== 'all' && category.includes('-') ? category.split('-', 2)[1] : 'all';

    setParentCat(parent);
    setSubCat(sub);
    setClothingType(sub === 'clothes' ? searchParameters.get('clothing_type') || 'all' : 'all');
  }, [searchParameters]);

  useEffect(() => {
    if (
      clothingTypesLoaded &&
      clothingType !== 'all' &&
      clothingTypes.every(type => type.value !== clothingType)
    ) {
      setClothingType('all');
    }
  }, [clothingType, clothingTypes, clothingTypesLoaded]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const parameters = JSON.stringify(listingParameters);
    if (previousListingParameters.current && previousListingParameters.current !== parameters) {
      window.scrollTo(0, 0);
    }
    previousListingParameters.current = parameters;
  }, [listingParameters]);

  useEffect(() => {
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      !loadMoreElement.current ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) void fetchNextPage();
      },
      { rootMargin: `${window.innerHeight}px 0px` },
    );
    observer.observe(loadMoreElement.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

  const filterSelects = (
    <>
      <Select
        onValueChange={v => {
          setParentCat(v);
          if (v === 'all') setSubCat('all');
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
      <Select
        onValueChange={value => {
          setSubCat(value);
          if (value !== 'clothes') setClothingType('all');
        }}
        value={subCat}
      >
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
      {subCat === 'clothes' && (
        <Select onValueChange={setClothingType} value={clothingType}>
          <SelectTrigger aria-label="Clothing type" className="w-[150px]">
            <SelectValue placeholder="Clothing type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clothing</SelectItem>
            {clothingTypes.map(type => (
              <SelectItem key={type.id} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
        <div
          className="
            flex flex-col gap-4
            md:flex-row md:items-center md:justify-between
          "
        >
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              onChange={event => setSearch(event.target.value)}
              value={search}
              placeholder="Search by listing, brand, or seller name..."
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
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
            <div
              className="
                hidden gap-2
                md:flex
              "
            >
              {filterSelects}
            </div>
            <div className="flex rounded-md border border-border">
              <Button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                size="icon"
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                className="h-8 w-8 rounded-none rounded-l-md"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setView('list')}
                aria-label="List view"
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
          <div
            className="
              mt-4 flex flex-wrap gap-2
              md:hidden
            "
          >
            {filterSelects}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              {listings.length} of {totalListings} listings
            </p>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="font-heading text-2xl font-semibold text-foreground">
                  No items found
                </p>
                <p className="mt-2 text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : view === 'grid' ? (
              <div
                className="
                  mt-4 grid grid-cols-2 gap-4
                  sm:grid-cols-3
                  lg:grid-cols-4
                "
              >
                {listings.map((l, index) => (
                  <ListingCard
                    key={l.id}
                    index={index}
                    listing={l}
                    sellerRating={sellerRatingsMap?.get(l.sellerId)}
                    showSellerByline
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {listings.map(l => {
                  const mediaUrls = getListingMediaUrls(l);
                  return (
                    <div
                      key={l.id}
                      className="group relative rounded-lg border border-border bg-card p-4"
                    >
                      <Link
                        aria-label={l.title}
                        to={`/listing/${l.id}`}
                        className="
                          absolute inset-0 z-10 block rounded-lg
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                        "
                      />
                      <div className="pointer-events-none relative flex gap-4">
                        <img
                          src={mediaUrls[0]}
                          alt={l.title}
                          className="h-28 w-28 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {l.brand}
                          </p>
                          <h3 className="text-sm font-semibold text-card-foreground">{l.title}</h3>
                          <p className="mt-1 text-sm font-bold text-card-foreground">
                            Rs {l.buyerTotalPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">incl. Platform Fee</p>
                          <p className="text-xs text-muted-foreground">
                            Size {l.size} · {formatEnumLabel(l.condition)}
                          </p>
                          <SellerByline
                            sellerId={l.sellerId}
                            sellerName={l.seller?.fullName}
                            sellerNameClassName="text-card-foreground"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={loadMoreElement} aria-hidden="true" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <Loader2 aria-label="Loading more listings" className="h-6 w-6 animate-spin" />
              </div>
            )}
            {isFetchNextPageError && (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-sm text-muted-foreground">Could not load more listings.</p>
                <Button onClick={() => void fetchNextPage()}>Retry</Button>
              </div>
            )}
            {!hasNextPage && listings.length > 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You have reached the end.
              </p>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Listings;
