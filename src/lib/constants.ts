export const PARENT_CATEGORIES = [
  { icon: '👗', label: 'Women', value: 'women' },
  { icon: '🧥', label: 'Men', value: 'men' },
  { icon: '🧒', label: 'Children', value: 'children' },
] as const;

export const SUBCATEGORIES = [
  { icon: '👔', label: 'Clothes', value: 'clothes' },
  { icon: '👟', label: 'Shoes', value: 'shoes' },
  { icon: '👜', label: 'Bags', value: 'bags' },
  { icon: '💍', label: 'Accessories', value: 'accessories' },
] as const;

/** Combined category value used in DB, e.g. "women-shoes" */
export const CATEGORIES = PARENT_CATEGORIES.flatMap(p =>
  SUBCATEGORIES.map(s => ({
    icon: s.icon,
    label: `${p.label} · ${s.label}`,
    parent: p.value,
    sub: s.value,
    value: `${p.value}-${s.value}`,
  })),
);

export const CONDITIONS = [
  { label: 'New with tags', value: 'new_with_tags' },
  { label: 'Like new', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
] as const;

export const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const;
export const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'] as const;

export const WEIGHT_OPTIONS = [
  { label: 'Less than 0.5 kg', value: '0.25' },
  { label: '0.5 – 1 kg', value: '0.75' },
  { label: '1 – 2 kg', value: '1.5' },
  { label: '2 – 3 kg', value: '2.5' },
  { label: '3 – 5 kg', value: '4' },
  { label: 'More than 5 kg', value: '6' },
] as const;

export function getWeightLabel(weight: number | null | undefined): string | null {
  if (weight == null)
    return null;
  const options = WEIGHT_OPTIONS.map(o => ({ ...o, num: Number(o.value) }));
  let closest = options[0];
  let minDistribution = Math.abs(options[0].num - weight);
  for (let index = 1; index < options.length; index++) {
    const distribution = Math.abs(options[index].num - weight);
    if (distribution < minDistribution) {
      minDistribution = distribution;
      closest = options[index];
    }
  }
  return closest.label;
}

export const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
] as const;

export interface Listing {
  id: string;
  admin_feedback?: string | null;
  brand: string;
  category: string;
  condition: string;
  created_at: string;
  description: string;
  images: string[];
  price: number;
  reserved_for?: string | null;
  reserved_offer_id?: string | null;
  reserved_until?: string | null;
  seller_id: string;
  seller_name: string;
  size: string;
  status: 'approved' | 'needs_revision' | 'pending' | 'rejected' | 'reserved' | 'sold';
  title: string;
  weight?: number | null;
}
