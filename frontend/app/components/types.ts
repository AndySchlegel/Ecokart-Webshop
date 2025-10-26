export type Article = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: string;
  rating?: number; // 0-5 stars
  reviewCount?: number; // number of reviews
};
