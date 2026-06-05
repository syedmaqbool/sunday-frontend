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

export const WEIGHT_OPTIONS = [
  { label: "Less than 0.5 kg", value: "0.25" },
  { label: "0.5 – 1 kg", value: "0.75" },
  { label: "1 – 2 kg", value: "1.5" },
  { label: "2 – 3 kg", value: "2.5" },
  { label: "3 – 5 kg", value: "4" },
  { label: "More than 5 kg", value: "6" },
] as const;

export const getWeightLabel = (weight: number | null | undefined): string | null => {
  if (weight == null) return null;
  const options = WEIGHT_OPTIONS.map((o) => ({ ...o, num: parseFloat(o.value) }));
  let closest = options[0];
  let minDist = Math.abs(options[0].num - weight);
  for (let i = 1; i < options.length; i++) {
    const dist = Math.abs(options[i].num - weight);
    if (dist < minDist) {
      minDist = dist;
      closest = options[i];
    }
  }
  return closest.label;
};

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

