// src/lib/mockConfig.ts

// Jab REST API integrate karni ho, isko false karden
export const isMockDataEnabled = true;
export interface Listing {
  id: string;
  brand?: string;
  category: string;
  condition: string;
  description: string;
  image_url: string;
  price: number;
  size?: string;
  title: string;
  user_id?: string;
}

export const DUMMY_LISTINGS: Listing[] = [
  {
    id: 'mock-1',
    brand: 'Zara',
    category: 'women',
    condition: 'Excellent',
    description: 'Premium quality oversized leather jacket from the 90s.',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
    price: 6500,
    size: 'M',
    title: 'Vintage Leather Jacket',
  },
  {
    id: 'mock-2',
    brand: 'Nike',
    category: 'men',
    condition: 'Good',
    description: 'Minimalist sneakers, perfect for casual outfits.',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    price: 3500,
    size: '42',
    title: 'Classic White Sneakers',
  },
  {
    id: 'mock-3',
    brand: 'H&M',
    category: 'children',
    condition: 'Like New',
    description: 'Comfortable and durable denim dungarees for toddlers.',
    image_url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600',
    price: 2200,
    size: '3-4Y',
    title: 'Kids Denim Dungarees',
  },
  {
    id: 'mock-4',
    brand: 'Mango',
    category: 'women',
    condition: 'New with tags',
    description: 'Lightweight floral dress perfect for hot days.',
    image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
    price: 2800,
    size: 'S',
    title: 'Bohemian Summer Dress',
  },
];
