export const PARENT_CATEGORIES = [
  { label: "Women", value: "women", icon: "👗" },
  { label: "Men", value: "men", icon: "🧥" },
  { label: "Children", value: "children", icon: "🧒" },
] as const;

export const SUBCATEGORIES = [
  { label: "Clothes", value: "clothes", icon: "👔" },
  { label: "Shoes", value: "shoes", icon: "👟" },
  { label: "Bags", value: "bags", icon: "👜" },
  { label: "Accessories", value: "accessories", icon: "💍" },
] as const;

/** Combined category value used in DB, e.g. "women-shoes" */
export const CATEGORIES = PARENT_CATEGORIES.flatMap(p =>
  SUBCATEGORIES.map(s => ({
    label: `${p.label} · ${s.label}`,
    value: `${p.value}-${s.value}`,
    parent: p.value,
    sub: s.value,
    icon: s.icon,
  }))
);

export const CONDITIONS = [
  { label: "New with tags", value: "new_with_tags" },
  { label: "Like new", value: "like_new" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
] as const;

export const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "One Size"] as const;

export const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
] as const;

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  size: string;
  brand: string;
  seller_id: string;
  seller_name: string;
  created_at: string;
  status: "pending" | "approved" | "rejected" | "sold" | "reserved" | "needs_revision";
  weight?: number | null;
  admin_feedback?: string | null;
  reserved_for?: string | null;
  reserved_until?: string | null;
  reserved_offer_id?: string | null;
};

