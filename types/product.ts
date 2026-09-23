export type ProductImage = {
  url: string;
  publicId: string;
  name?: string;
  alt?: string;
  isDefault?: boolean;
};

export type ProductSize = {
  _id?: string;
  size: string;
  sku?: string;
  stock: number;
  isActive?: boolean;
};

export type ProductCategory = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  level?: number;
};

export type ProductRatings = {
  average: number;
  count: number;
};

export type ProductColor = {
  _id?: string;

  /* Legacy aliases returned by /api/products/active. */
  name?: string;
  slug?: string;

  /* Clean catalog API fields. */
  nameProduct: string;
  slugProduct: string;
  nameColor: string;
  slugColor: string;
  hex?: string;
  isDefault?: boolean;

  shortDescription?: string;
  description?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;

  images: ProductImage[];
  sizes: ProductSize[];

  isActive?: boolean;
  sortOrder?: number;
};

export type Product = {
  _id: string;

  ratings?: ProductRatings;
  categories?: ProductCategory[];

  isColor?: boolean;
  colors?: ProductColor[];

  isActive?: boolean;
  isFeatured?: boolean;
  isNewLaunch?: boolean;

  createdAt?: string;
  updatedAt?: string;

  /*
    Legacy commerce fields used by existing cart/PDP APIs.
    The clean /api/products/catalog response does not expose these.
  */
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock?: number;
  mainImages?: ProductImage[];
  status?: "draft" | "active" | "inactive" | string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export type ProductCatalogApiResponse = {
  success: boolean;
  count: number;
  products: Product[];
  message?: string;
};
