export const CATEGORIES = [
  { label: "Women", value: "women", icon: "👗" },
  { label: "Men", value: "men", icon: "🧥" },
  { label: "Shoes", value: "shoes", icon: "👟" },
  { label: "Bags", value: "bags", icon: "👜" },
  { label: "Accessories", value: "accessories", icon: "💍" },
  { label: "Jewelry", value: "jewelry", icon: "✨" },
] as const;

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
  status: "pending" | "approved" | "rejected";
  weight?: number | null;
};

// Mock data for initial UI
export const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Vintage Chanel Tweed Jacket",
    description: "Authentic vintage Chanel tweed jacket in excellent condition. Classic silhouette with gold button details.",
    price: 2450,
    images: ["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600"],
    category: "women",
    condition: "like_new",
    size: "M",
    brand: "Chanel",
    seller_id: "s1",
    seller_name: "LuxeResale",
    created_at: "2026-03-01",
    status: "approved",
  },
  {
    id: "2",
    title: "Nike Air Jordan 1 Retro High",
    description: "Brand new with tags. Limited edition colorway, never worn.",
    price: 320,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
    category: "shoes",
    condition: "new_with_tags",
    size: "42",
    brand: "Nike",
    seller_id: "s2",
    seller_name: "SneakerVault",
    created_at: "2026-03-02",
    status: "approved",
  },
  {
    id: "3",
    title: "Gucci Marmont Mini Bag",
    description: "Iconic GG Marmont mini bag in dusty pink. Comes with dust bag and box.",
    price: 1180,
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600"],
    category: "bags",
    condition: "good",
    size: "One Size",
    brand: "Gucci",
    seller_id: "s3",
    seller_name: "DesignerFinds",
    created_at: "2026-03-01",
    status: "approved",
  },
  {
    id: "4",
    title: "Acne Studios Oversized Hoodie",
    description: "Minimalist oversized hoodie in stone grey. Barely worn, perfect condition.",
    price: 185,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600"],
    category: "men",
    condition: "like_new",
    size: "L",
    brand: "Acne Studios",
    seller_id: "s4",
    seller_name: "MinimalCloset",
    created_at: "2026-02-28",
    status: "approved",
  },
  {
    id: "5",
    title: "Cartier Love Bracelet",
    description: "18k rose gold Cartier Love bracelet. Size 17. Includes screwdriver and original box.",
    price: 5200,
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"],
    category: "jewelry",
    condition: "good",
    size: "One Size",
    brand: "Cartier",
    seller_id: "s5",
    seller_name: "GoldStandard",
    created_at: "2026-02-27",
    status: "approved",
  },
  {
    id: "6",
    title: "Ray-Ban Aviator Sunglasses",
    description: "Classic gold-frame aviators with green lenses. Like new condition.",
    price: 95,
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"],
    category: "accessories",
    condition: "like_new",
    size: "One Size",
    brand: "Ray-Ban",
    seller_id: "s6",
    seller_name: "StyleEdit",
    created_at: "2026-02-26",
    status: "approved",
  },
];
