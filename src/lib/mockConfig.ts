// src/lib/mockConfig.ts

// Jab REST API integrate karni ho, isko false karden
export const NEXT_PUBLIC_USE_MOCK_DATA = true;
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  condition: string;
  size?: string;
  brand?: string;        
  user_id?: string;
}

export const DUMMY_LISTINGS: Listing[] = [
  {
    id: "mock-1",
    title: "Vintage Leather Jacket",
    description: "Premium quality oversized leather jacket from the 90s.",
    price: 6500,
    image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
    category: "women",        
    condition: "Excellent",
    size: "M",
    brand: "Zara"             
  },
  {
    id: "mock-2",
    title: "Classic White Sneakers",
    description: "Minimalist sneakers, perfect for casual outfits.",
    price: 3500,
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600",
    category: "men",          
    condition: "Good",
    size: "42",
    brand: "Nike"
  },
  {
    id: "mock-3",
    title: "Kids Denim Dungarees",
    description: "Comfortable and durable denim dungarees for toddlers.",
    price: 2200,
    image_url: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600",
    category: "children",     
    condition: "Like New",
    size: "3-4Y",
    brand: "H&M"
  },
  {
    id: "mock-4",
    title: "Bohemian Summer Dress",
    description: "Lightweight floral dress perfect for hot days.",
    price: 2800,
    image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600",
    category: "women",        
    condition: "New with tags",
    size: "S",
    brand: "Mango"
  }
];