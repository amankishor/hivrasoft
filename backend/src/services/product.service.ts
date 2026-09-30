import { Types } from "mongoose";

import Product, {
  IProductColor,
  IProductImage,
  IProductSize,
} from "../models/Product.model";

import Category from "../models/Category.model";
import { createSlug } from "../utils/slug";
import { sanitizeProductDescriptionHtml } from "../utils/productHtml";

import {
  uploadImageBuffer,
  deleteCloudinaryImage,
  deleteCloudinaryImages,
  deleteCloudinaryFolderIfEmpty,
  getCloudinaryFolderFromPublicId,
} from "./cloudinary.service";

/* =========================================================
   TYPES
========================================================= */

export type ProductImageInput = {
  url: string;
  publicId: string;
  isDefault?: boolean;
};

export type ProductSizeInput = {
  _id?: string;
  size: string;
  stock: number;
  originalPrice: number;
  showPrice: number;
  discountPrice?: number;
  isActive?: boolean;
};

export type ProductColorInput = {
  _id?: string;

  nameProduct: string;
  slugProduct?: string;

  nameColor: string;
  slugColor?: string;

  hex?: string;
  isDefault?: boolean;

  originalPrice: number;
  showPrice: number;
  discountPrice?: number;

  shortDescription?: string;
  description?: string;
  tags?: string[];

  seoTitle?: string;
  seoDescription?: string;

  images?: ProductImageInput[];
  sizes?: ProductSizeInput[];
};

export type CreateProductInput = {
  categories: string[];
  isColor?: boolean;
  colors?: ProductColorInput[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNewLaunch?: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type ProductUploadFile = {
  buffer: Buffer;
  originalname: string;
};

const PRODUCT_ROOT_FOLDER = "hivrasoft/products";

/* =========================================================
   HELPERS
========================================================= */

const normalizeSlug = (value: string): string => {
  const cleaned = String(value || "").trim();

  if (!cleaned) {
    throw new Error("Slug value is required.");
  }

  const slug = createSlug(cleaned);

  if (!slug) {
    throw new Error("Unable to generate slug.");
  }

  return slug;
};

const imageNameFromFile = (originalname: string): string => {
  const withoutExtension = originalname
    .replace(/\.[^/.]+$/, "")
    .trim();

  return createSlug(withoutExtension) || "image";
};

const getProductColorFolder = (
  slugProduct: string,
  slugColor: string
): string => {
  return [
    PRODUCT_ROOT_FOLDER,
    normalizeSlug(slugProduct),
    "colors",
    normalizeSlug(slugColor),
  ].join("/");
};

const validateCategories = async (
  categoryIds: string[]
): Promise<Types.ObjectId[]> => {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new Error("At least one category is required.");
  }

  const uniqueIds = [
    ...new Set(categoryIds.map((value) => String(value).trim())),
  ].filter(Boolean);

  for (const categoryId of uniqueIds) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error(`Invalid category ID: ${categoryId}`);
    }
  }

  const objectIds = uniqueIds.map(
    (categoryId) => new Types.ObjectId(categoryId)
  );

  const totalCategories = await Category.countDocuments({
    _id: { $in: objectIds },
  });

  if (totalCategories !== objectIds.length) {
    throw new Error("One or more selected categories do not exist.");
  }

  return objectIds;
};

const normalizeTags = (tags?: string[]): string[] => {
  if (!tags) return [];

  if (!Array.isArray(tags)) {
    throw new Error("Tags must be an array.");
  }

  return [
    ...new Set(
      tags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
};

const normalizeImages = (
  images?: ProductImageInput[]
): IProductImage[] => {
  if (!images) return [];

  if (!Array.isArray(images)) {
    throw new Error("Product images must be an array.");
  }

  const publicIds = new Set<string>();

  const normalized = images.map((image, index) => {
    const url = image.url?.trim();
    const publicId = image.publicId?.trim();

    if (!url || !publicId) {
      throw new Error(`Image ${index + 1} requires url and publicId.`);
    }

    if (publicIds.has(publicId)) {
      throw new Error(`Duplicate image publicId: ${publicId}`);
    }

    publicIds.add(publicId);

    return {
      url,
      publicId,
      isDefault: image.isDefault ?? index === 0,
    };
  });

  if (normalized.length > 0) {
    const selectedDefault = normalized.findIndex((image) => image.isDefault);
    const defaultIndex = selectedDefault >= 0 ? selectedDefault : 0;

    normalized.forEach((image, index) => {
      image.isDefault = index === defaultIndex;
    });
  }

  return normalized;
};

const normalizePrice = (
  originalValue: number | undefined,
  showValue: number | undefined,
  label: string
) => {
  const originalPrice = Number(originalValue);
  const showPrice = Number(showValue);

  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    throw new Error(`${label}: originalPrice must be 0 or greater.`);
  }

  if (!Number.isFinite(showPrice) || showPrice < 0) {
    throw new Error(`${label}: showPrice must be 0 or greater.`);
  }

  if (showPrice > originalPrice) {
    throw new Error(`${label}: showPrice cannot be greater than originalPrice.`);
  }

  return {
    originalPrice,
    showPrice,
    discountPrice: Number((originalPrice - showPrice).toFixed(2)),
  };
};

const normalizeSizes = (
  sizes: ProductSizeInput[] | undefined,
  colorName: string,
  existingSizes: IProductSize[] = []
): IProductSize[] => {
  if (!sizes) return [];

  if (!Array.isArray(sizes)) {
    throw new Error(`Sizes for ${colorName} must be an array.`);
  }

  const usedSizes = new Set<string>();

  return sizes.map((size, index) => {
    const sizeName = size.size?.trim().toUpperCase();

    if (!sizeName) {
      throw new Error(`${colorName} size ${index + 1} is required.`);
    }

    if (usedSizes.has(sizeName)) {
      throw new Error(`Duplicate size ${sizeName} in ${colorName}.`);
    }

    usedSizes.add(sizeName);

    const stock = Number(size.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(
        `${colorName} / ${sizeName}: stock must be a whole number 0 or greater.`
      );
    }

    const pricing = normalizePrice(
      size.originalPrice,
      size.showPrice,
      `${colorName} / ${sizeName}`
    );

    let id: Types.ObjectId | undefined;

    if (size._id && Types.ObjectId.isValid(size._id)) {
      id = new Types.ObjectId(size._id);
    } else {
      id = existingSizes.find((item) => item.size === sizeName)?._id;
    }

    return {
      _id: id || new Types.ObjectId(),
      size: sizeName,
      stock,
      originalPrice: pricing.originalPrice,
      showPrice: pricing.showPrice,
      discountPrice: pricing.discountPrice,
      isActive: size.isActive ?? true,
    };
  });
};

const normalizeColors = (
  colors?: ProductColorInput[],
  existingColors: IProductColor[] = []
): IProductColor[] => {
  if (!colors) return [];

  if (!Array.isArray(colors)) {
    throw new Error("Product colors must be an array.");
  }

  const usedProductSlugs = new Set<string>();
  const usedColorSlugs = new Set<string>();

  const normalized = colors.map((color, index) => {
    const nameProduct = String(color.nameProduct || "").trim();
    const nameColor = String(color.nameColor || "").trim();

    if (!nameProduct) {
      throw new Error(`Color ${index + 1}: product name is required.`);
    }

    if (!nameColor) {
      throw new Error(`Color ${index + 1}: color name is required.`);
    }

    const slugProduct = normalizeSlug(color.slugProduct || nameProduct);
    const slugColor = normalizeSlug(color.slugColor || nameColor);

    if (usedProductSlugs.has(slugProduct)) {
      throw new Error(`Duplicate product slug: ${slugProduct}`);
    }

    if (usedColorSlugs.has(slugColor)) {
      throw new Error(`Duplicate color slug: ${slugColor}`);
    }

    usedProductSlugs.add(slugProduct);
    usedColorSlugs.add(slugColor);

    const pricing = normalizePrice(
      color.originalPrice,
      color.showPrice,
      `${nameProduct} / ${nameColor}`
    );

    const existingColor = existingColors.find((item) => {
      if (color._id && item._id?.toString() === color._id) return true;
      return (
        item.slugColor === slugColor || item.slugProduct === slugProduct
      );
    });

    let colorId: Types.ObjectId | undefined;

    if (color._id && Types.ObjectId.isValid(color._id)) {
      colorId = new Types.ObjectId(color._id);
    } else {
      colorId = existingColor?._id;
    }

    return {
      _id: colorId || new Types.ObjectId(),
      nameProduct,
      slugProduct,
      nameColor,
      slugColor,
      hex: String(color.hex || "").trim(),
      isDefault: color.isDefault ?? index === 0,
      originalPrice: pricing.originalPrice,
      showPrice: pricing.showPrice,
      discountPrice: pricing.discountPrice,
      shortDescription: String(color.shortDescription || "").trim(),
      description: sanitizeProductDescriptionHtml(
        String(color.description || "")
      ),
      tags: normalizeTags(color.tags),
      seoTitle: String(color.seoTitle || "").trim(),
      seoDescription: String(color.seoDescription || "").trim(),
      images: normalizeImages(color.images),
      sizes: normalizeSizes(
        color.sizes,
        nameColor,
        existingColor?.sizes || []
      ),
    };
  });

  if (normalized.length > 0) {
    const selectedDefault = normalized.findIndex((color) => color.isDefault);
    const defaultIndex = selectedDefault >= 0 ? selectedDefault : 0;

    normalized.forEach((color, index) => {
      color.isDefault = index === defaultIndex;
    });
  }

  return normalized;
};

const validateColorMode = (
  isColor: boolean,
  colors?: ProductColorInput[]
) => {
  const hasColors = Array.isArray(colors) && colors.length > 0;

  if (isColor && !hasColors) {
    throw new Error("At least one color is required when isColor is true.");
  }

  if (!isColor && hasColors) {
    throw new Error("Colors are not allowed when isColor is false.");
  }
};

const validateUniqueProductSlugs = async (
  colors: IProductColor[],
  excludeProductId?: string
) => {
  for (const color of colors) {
    const query: Record<string, unknown> = {
      "colors.slugProduct": color.slugProduct,
    };

    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }

    const existing = await Product.findOne(query).select("_id").lean();

    if (existing) {
      throw new Error(`Product slug already exists: ${color.slugProduct}`);
    }
  }
};

const getProductImagePublicIds = (product: {
  colors?: Array<{ images?: Array<{ publicId?: string }> }>;
}): string[] => {
  const publicIds: string[] = [];

  for (const color of product.colors || []) {
    for (const image of color.images || []) {
      if (image.publicId) publicIds.push(image.publicId);
    }
  }

  return [...new Set(publicIds)];
};

const cleanupFolders = async (publicIds: string[]) => {
  const folders = [
    ...new Set(
      publicIds
        .map((publicId) => getCloudinaryFolderFromPublicId(publicId))
        .filter(Boolean)
    ),
  ] as string[];

  await Promise.allSettled(
    folders.map((folder) => deleteCloudinaryFolderIfEmpty(folder))
  );
};

/* =========================================================
   LEGACY VARIANT ID FIX

   Old color schema used _id:false.
   This assigns and persists color/size IDs when old products are read.
========================================================= */

const ensureVariantIds = async (product: any) => {
  let changed = false;

  for (const color of product.colors || []) {
    if (!color._id) {
      color._id = new Types.ObjectId();
      changed = true;
    }

    for (const size of color.sizes || []) {
      if (!size._id) {
        size._id = new Types.ObjectId();
        changed = true;
      }
    }
  }

  if (changed) {
    product.markModified("colors");
    await product.save();
  }

  return product;
};

const findColor = (product: any, colorSlug: string) => {
  const normalizedColorSlug = normalizeSlug(colorSlug);

  const color = product.colors.find(
    (item: IProductColor) => item.slugColor === normalizedColorSlug
  );

  if (!color) {
    throw new Error("Product color not found.");
  }

  return color;
};

/* =========================================================
   CREATE PRODUCT
========================================================= */

export const createProduct = async (input: CreateProductInput) => {
  const categories = await validateCategories(input.categories);
  const isColor = input.isColor ?? true;

  validateColorMode(isColor, input.colors);

  const colors = isColor ? normalizeColors(input.colors) : [];

  await validateUniqueProductSlugs(colors);

  const product = await Product.create({
    ratings: { average: 0, count: 0 },
    categories,
    isColor,
    colors,
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
    isNewLaunch: input.isNewLaunch ?? false,
  });

  return product;
};

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

export const getAllProducts = async () => {
  const products = await Product.find()
    .populate("categories", "_id name slug level")
    .sort({ createdAt: -1 });

  await Promise.all(products.map((product) => ensureVariantIds(product)));

  return products;
};

/* =========================================================
   GET ACTIVE PRODUCTS
========================================================= */

export const getActiveProducts = async () => {
  const products = await Product.find({ isActive: true })
    .populate("categories", "_id name slug level")
    .sort({ createdAt: -1 });

  await Promise.all(products.map((product) => ensureVariantIds(product)));

  return products;
};

/* =========================================================
   GET FEATURED PRODUCTS
========================================================= */

export const getFeaturedProducts = async () => {
  const products = await Product.find({
    isActive: true,
    isFeatured: true,
  })
    .populate("categories", "_id name slug level")
    .sort({ createdAt: -1 });

  await Promise.all(products.map((product) => ensureVariantIds(product)));

  return products;
};

/* =========================================================
   GET NEW LAUNCH PRODUCTS
========================================================= */

export const getNewLaunchProducts = async () => {
  const products = await Product.find({
    isActive: true,
    isNewLaunch: true,
  })
    .populate("categories", "_id name slug level")
    .sort({ createdAt: -1 });

  await Promise.all(products.map((product) => ensureVariantIds(product)));

  return products;
};

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export const getProductById = async (productId: string) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId).populate(
    "categories",
    "_id name slug level"
  );

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  return product;
};

/* =========================================================
   GET PRODUCT BY PRODUCT SLUG
========================================================= */

export const getProductBySlug = async (slug: string) => {
  const normalizedSlug = normalizeSlug(slug);

  const product = await Product.findOne({
    "colors.slugProduct": normalizedSlug,
  }).populate("categories", "_id name slug level");

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  return product;
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export const updateProduct = async (
  productId: string,
  input: UpdateProductInput
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const oldImageIds = getProductImagePublicIds(product);

  if (input.categories !== undefined) {
    product.categories = await validateCategories(input.categories);
  }

  const nextIsColor =
    input.isColor !== undefined ? input.isColor : product.isColor;

  if (input.colors !== undefined) {
    validateColorMode(nextIsColor, input.colors);

    const colors = nextIsColor
      ? normalizeColors(input.colors, product.colors)
      : [];

    await validateUniqueProductSlugs(colors, productId);

    product.colors = colors;
  } else if (!nextIsColor) {
    product.colors = [];
  }

  product.isColor = nextIsColor;

  if (product.isColor && product.colors.length === 0) {
    throw new Error("At least one color is required when isColor is true.");
  }

  if (input.isActive !== undefined) {
    product.isActive = input.isActive;
  }

  if (input.isFeatured !== undefined) {
    product.isFeatured = input.isFeatured;
  }

  if (input.isNewLaunch !== undefined) {
    product.isNewLaunch = input.isNewLaunch;
  }

  product.markModified("colors");
  await product.save();

  const newImageIds = new Set(getProductImagePublicIds(product));

  const removedImages = oldImageIds.filter(
    (publicId) => !newImageIds.has(publicId)
  );

  if (removedImages.length > 0) {
    await deleteCloudinaryImages(removedImages);
    await cleanupFolders(removedImages);
  }

  return product;
};

/* =========================================================
   UPLOAD PRODUCT COLOR IMAGES
========================================================= */

export const uploadProductColorImages = async (
  productId: string,
  colorSlug: string,
  files: ProductUploadFile[]
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("At least one image is required.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const color = findColor(product, colorSlug);

  const folder = getProductColorFolder(
    color.slugProduct,
    color.slugColor
  );

  const uploadedImages: IProductImage[] = [];
  const uploadedPublicIds: string[] = [];

  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const imageName = imageNameFromFile(file.originalname);
      const imageNumber = color.images.length + index + 1;

      const publicId = `${imageName}-${String(imageNumber).padStart(2, "0")}`;

      const result = await uploadImageBuffer(
        file.buffer,
        folder,
        publicId
      );

      uploadedPublicIds.push(result.public_id);

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        isDefault: color.images.length === 0 && index === 0,
      });
    }

    const existingDefault = color.images.some(
      (image: IProductImage) => image.isDefault
    );

    if (existingDefault) {
      uploadedImages.forEach((image) => {
        image.isDefault = false;
      });
    }

    color.images.push(...uploadedImages);

    product.markModified("colors");
    await product.save();

    return {
      productId: product._id,
      colorId: color._id,
      slugProduct: color.slugProduct,
      slugColor: color.slugColor,
      folder,
      images: uploadedImages,
    };
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await deleteCloudinaryImages(uploadedPublicIds);
      await deleteCloudinaryFolderIfEmpty(folder);
    }

    throw error;
  }
};

/* =========================================================
   DELETE ONE PRODUCT COLOR IMAGE
========================================================= */

export const deleteProductColorImage = async (
  productId: string,
  colorSlug: string,
  publicId: string
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const color = findColor(product, colorSlug);

  const imageIndex = color.images.findIndex(
    (image: IProductImage) => image.publicId === publicId
  );

  if (imageIndex === -1) {
    throw new Error("Product image not found.");
  }

  const removedImage = color.images[imageIndex];
  const wasDefault = removedImage.isDefault;

  color.images.splice(imageIndex, 1);

  if (wasDefault && color.images.length > 0) {
    color.images.forEach((image: IProductImage, index: number) => {
      image.isDefault = index === 0;
    });
  }

  product.markModified("colors");
  await product.save();

  await deleteCloudinaryImage(publicId);

  const folder = getCloudinaryFolderFromPublicId(publicId);

  if (folder) {
    await deleteCloudinaryFolderIfEmpty(folder);
  }

  return product;
};

/* =========================================================
   SET DEFAULT PRODUCT IMAGE
========================================================= */

export const setDefaultProductColorImage = async (
  productId: string,
  colorSlug: string,
  publicId: string
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const color = findColor(product, colorSlug);

  const selectedImage = color.images.find(
    (image: IProductImage) => image.publicId === publicId
  );

  if (!selectedImage) {
    throw new Error("Product image not found.");
  }

  color.images.forEach((image: IProductImage) => {
    image.isDefault = image.publicId === publicId;
  });

  product.markModified("colors");
  await product.save();

  return product;
};

/* =========================================================
   SET DEFAULT COLOR
========================================================= */

export const setDefaultProductColor = async (
  productId: string,
  colorSlug: string
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const normalizedColorSlug = normalizeSlug(colorSlug);

  const exists = product.colors.some(
    (color) => color.slugColor === normalizedColorSlug
  );

  if (!exists) {
    throw new Error("Product color not found.");
  }

  product.colors.forEach((color) => {
    color.isDefault = color.slugColor === normalizedColorSlug;
  });

  product.markModified("colors");
  await product.save();

  return product;
};

/* =========================================================
   ADD SIZE
========================================================= */

export const addProductSize = async (
  productId: string,
  colorSlug: string,
  input: ProductSizeInput
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const color = findColor(product, colorSlug);

  const normalized = normalizeSizes(
    [input],
    color.nameColor,
    color.sizes
  )[0];

  const duplicate = color.sizes.some(
    (size) => size.size === normalized.size
  );

  if (duplicate) {
    throw new Error(
      `Size ${normalized.size} already exists in ${color.nameColor}.`
    );
  }

  color.sizes.push(normalized);

  product.markModified("colors");
  await product.save();

  return product;
};

/* =========================================================
   UPDATE SIZE
========================================================= */

export const updateProductSize = async (
  productId: string,
  colorSlug: string,
  sizeId: string,
  input: Partial<ProductSizeInput>
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  if (!Types.ObjectId.isValid(sizeId)) {
    throw new Error("Invalid size ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const color = findColor(product, colorSlug);

  const size = color.sizes.find(
    (item: IProductSize) => item._id?.toString() === sizeId
  );

  if (!size) {
    throw new Error("Product size not found.");
  }

  if (input.size !== undefined) {
    const nextSize = input.size.trim().toUpperCase();

    if (!nextSize) {
      throw new Error("Size cannot be empty.");
    }

    const duplicate = color.sizes.some(
      (item: IProductSize) =>
        item._id?.toString() !== sizeId && item.size === nextSize
    );

    if (duplicate) {
      throw new Error(`Size ${nextSize} already exists.`);
    }

    size.size = nextSize;
  }

  if (input.stock !== undefined) {
    const stock = Number(input.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("Stock must be a whole number 0 or greater.");
    }

    size.stock = stock;
  }

  if (
    input.originalPrice !== undefined ||
    input.showPrice !== undefined ||
    input.discountPrice !== undefined
  ) {
    const pricing = normalizePrice(
      input.originalPrice !== undefined
        ? input.originalPrice
        : size.originalPrice,
      input.showPrice !== undefined ? input.showPrice : size.showPrice,
      `${color.nameColor} / ${size.size}`
    );

    size.originalPrice = pricing.originalPrice;
    size.showPrice = pricing.showPrice;
    size.discountPrice = pricing.discountPrice;
  }

  if (input.isActive !== undefined) {
    size.isActive = input.isActive;
  }

  product.markModified("colors");
  await product.save();

  return product;
};

/* =========================================================
   DELETE SIZE
========================================================= */

export const deleteProductSize = async (
  productId: string,
  colorSlug: string,
  sizeId: string
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  if (!Types.ObjectId.isValid(sizeId)) {
    throw new Error("Invalid size ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  const color = findColor(product, colorSlug);

  const sizeIndex = color.sizes.findIndex(
    (size: IProductSize) => size._id?.toString() === sizeId
  );

  if (sizeIndex === -1) {
    throw new Error("Product size not found.");
  }

  color.sizes.splice(sizeIndex, 1);

  product.markModified("colors");
  await product.save();

  return product;
};

/* =========================================================
   CATALOG RESPONSE

   IMPORTANT:
   colorId and sizeId are exposed for Add To Bag / Cart API.
========================================================= */

export const toCatalogProduct = (input: any) => {
  const product =
    typeof input?.toObject === "function" ? input.toObject() : input;

  return {
    _id: product._id,
    id: product._id?.toString?.() || String(product._id || ""),

    ratings: {
      average: product.ratings?.average ?? 0,
      count: product.ratings?.count ?? 0,
    },

    categories: product.categories || [],
    isColor: product.isColor === true,

    colors: Array.isArray(product.colors)
      ? product.colors.map((color: any) => ({
          _id: color._id,
          id: color._id?.toString?.() || String(color._id || ""),
          colorId: color._id?.toString?.() || String(color._id || ""),

          nameProduct: color.nameProduct,
          slugProduct: color.slugProduct,

          nameColor: color.nameColor,
          slugColor: color.slugColor,

          hex: color.hex || "",
          isDefault: Boolean(color.isDefault),
          isActive: color.isActive !== false,

          originalPrice: Number(color.originalPrice || 0),
          showPrice: Number(color.showPrice || 0),
          discountPrice: Number(color.discountPrice || 0),

          shortDescription: color.shortDescription || "",
          description: color.description || "",
          tags: color.tags || [],
          seoTitle: color.seoTitle || "",
          seoDescription: color.seoDescription || "",

          images: Array.isArray(color.images)
            ? color.images.map((image: any) => ({
                url: image.url,
                publicId: image.publicId,
                isDefault: Boolean(image.isDefault),
              }))
            : [],

          sizes: Array.isArray(color.sizes)
            ? color.sizes.map((size: any) => ({
                _id: size._id,
                id: size._id?.toString?.() || String(size._id || ""),
                sizeId: size._id?.toString?.() || String(size._id || ""),

                size: size.size,
                stock: Number(size.stock || 0),

                originalPrice: Number(size.originalPrice || 0),
                showPrice: Number(size.showPrice || 0),
                discountPrice: Number(size.discountPrice || 0),

                isActive: size.isActive !== false,
              }))
            : [],
        }))
      : [],

    isActive: product.isActive === true,
    isFeatured: product.isFeatured === true,
    isNewLaunch: product.isNewLaunch === true,

    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

/* =========================================================
   GET CATALOG
========================================================= */

export const getProductCatalog = async () => {
  const products = await Product.find({ isActive: true })
    .populate("categories", "_id name slug level")
    .sort({ createdAt: -1 });

  await Promise.all(products.map((product) => ensureVariantIds(product)));

  return products.map(toCatalogProduct);
};

/* =========================================================
   GET CATALOG PRODUCT BY SLUG
========================================================= */

export const getCatalogProductBySlug = async (slug: string) => {
  const product = await Product.findOne({
    isActive: true,
    "colors.slugProduct": normalizeSlug(slug),
  }).populate("categories", "_id name slug level");

  if (!product) {
    throw new Error("Product not found.");
  }

  await ensureVariantIds(product);

  return toCatalogProduct(product);
};

/* =========================================================
   DELETE PRODUCT
========================================================= */

export const deleteProduct = async (productId: string) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  const publicIds = getProductImagePublicIds(product);

  if (publicIds.length > 0) {
    await deleteCloudinaryImages(publicIds);
  }

  await Product.deleteOne({ _id: product._id });
  await cleanupFolders(publicIds);

  return {
    success: true,
    message: "Product deleted successfully.",
    deletedImages: publicIds.length,
  };
};

/* =========================================================
   UPDATE PRODUCT RATING SUMMARY
========================================================= */

export const updateProductRatingSummary = async (
  productId: string,
  average: number,
  count: number
) => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const safeAverage = Math.max(0, Math.min(5, Number(average) || 0));
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));

  const product = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        "ratings.average": Number(safeAverage.toFixed(2)),
        "ratings.count": safeCount,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
};
