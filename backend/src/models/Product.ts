export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreateInput {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}

export interface ProductUpdateInput {
  name?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}
