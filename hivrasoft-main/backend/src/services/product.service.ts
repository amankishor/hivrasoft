import {
  Types,
} from "mongoose";

import Product, {
  IProductColor,
  IProductImage,
  ProductStatus,
} from "../models/Product.model";

import Category from "../models/Category.model";

import {
  createSlug,
} from "../utils/slug";

import {
  sanitizeProductDescriptionHtml,
} from "../utils/productHtml";

import {
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
};

export type ProductSizeInput = {
  size: string;
  sku: string;
  stock: number;
  isActive?: boolean;
};

export type ProductColorInput = {
  name: string;
  slug?: string;
  hex?: string;

  images?: ProductImageInput[];

  sizes?: ProductSizeInput[];

  isActive?: boolean;

  sortOrder?: number;
};

export type CreateProductInput = {
  name: string;

  /*
    Optional manual slug from admin.
    Example input: "Coral Red Bra 2026"
    Saved slug:   "coral-red-bra-2026"

    If empty, backend generates a unique slug from product name.
  */
  slug?: string;

  shortDescription?: string;

  description?: string;

  categories: string[];

  price: number;

  compareAtPrice?: number;

  costPrice?: number;

  /*
    Single overall stock value for the product.
  */
  stock: number;

  mainImages?: ProductImageInput[];

  colors?: ProductColorInput[];

  status?: ProductStatus;

  isFeatured?: boolean;

  isNewLaunch?: boolean;

  tags?: string[];

  seoTitle?: string;

  seoDescription?: string;
};

export type UpdateProductInput =
  Partial<CreateProductInput>;

/* =========================================================
   PRODUCT SLUG

   Admin can manually enter any readable value.
   Backend converts it to a safe URL slug.

   Examples:
   "Coral Red Bra 2026" -> "coral-red-bra-2026"
   "Sports Bra / Pink"  -> "sports-bra-pink"

   Manual slug:
   - exact normalized slug must be unique
   - duplicate -> error

   Empty slug:
   - auto generated from product name
   - duplicate auto slug gets -2, -3, ...
========================================================= */

const normalizeProductSlug = (
  value: string
): string => {
  /*
    Product slug supports letters/numbers from multiple languages.
    Spaces and symbols become hyphens.
  */
  const slug =
    String(
      value ||
      ""
    )
      .normalize("NFKC")
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(
        /[^\p{L}\p{N}]+/gu,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  if (!slug) {
    throw new Error(
      "Product slug must contain at least one letter or number."
    );
  }

  return slug;
};

const isProductSlugTaken =
  async (
    slug: string,
    excludeId?: string
  ): Promise<boolean> => {
    const query: Record<
      string,
      unknown
    > = {
      slug,
    };

    if (excludeId) {
      query._id = {
        $ne:
          excludeId,
      };
    }

    const existing =
      await Product.findOne(
        query
      )
        .select("_id")
        .lean();

    return Boolean(
      existing
    );
  };

const generateUniqueProductSlug =
  async (
    name: string,
    excludeId?: string
  ): Promise<string> => {
    const baseSlug =
      normalizeProductSlug(
        name
      );

    let slug =
      baseSlug;

    let counter =
      2;

    while (
      await isProductSlugTaken(
        slug,
        excludeId
      )
    ) {
      slug =
        `${baseSlug}-${counter}`;

      counter += 1;
    }

    return slug;
  };

const resolveProductSlug =
  async (
    name: string,
    requestedSlug?: string,
    excludeId?: string
  ): Promise<string> => {
    const rawSlug =
      requestedSlug
        ?.trim();

    if (!rawSlug) {
      return generateUniqueProductSlug(
        name,
        excludeId
      );
    }

    const slug =
      normalizeProductSlug(
        rawSlug
      );

    const duplicate =
      await isProductSlugTaken(
        slug,
        excludeId
      );

    if (duplicate) {
      throw new Error(
        `Product slug already exists: ${slug}`
      );
    }

    return slug;
  };

/* =========================================================
   VALIDATE CATEGORIES
========================================================= */

const validateCategories =
  async (
    categoryIds: string[]
  ): Promise<
    Types.ObjectId[]
  > => {
    if (
      !Array.isArray(
        categoryIds
      ) ||
      categoryIds.length ===
        0
    ) {
      throw new Error(
        "At least one category is required."
      );
    }

    const uniqueIds =
      [
        ...new Set(
          categoryIds.map(
            String
          )
        ),
      ];

    for (
      const categoryId
      of uniqueIds
    ) {
      if (
        !Types.ObjectId.isValid(
          categoryId
        )
      ) {
        throw new Error(
          `Invalid category ID: ${categoryId}`
        );
      }
    }

    const objectIds =
      uniqueIds.map(
        (
          categoryId
        ) =>
          new Types.ObjectId(
            categoryId
          )
      );

    const count =
      await Category.countDocuments({
        _id: {
          $in:
            objectIds,
        },
      });

    if (
      count !==
      objectIds.length
    ) {
      throw new Error(
        "One or more selected categories do not exist."
      );
    }

    return objectIds;
  };

/* =========================================================
   NORMALIZE IMAGES

   No hard application-level image count limit.
   This is used for mainImages[] and colors[].images[].
========================================================= */

const normalizeImages =
  (
    images:
      | ProductImageInput[]
      | undefined,
    fieldName: string
  ): IProductImage[] => {
    if (!images) {
      return [];
    }

    if (
      !Array.isArray(
        images
      )
    ) {
      throw new Error(
        `${fieldName} must be an array.`
      );
    }

    const usedPublicIds =
      new Set<string>();

    return images.map(
      (
        image,
        index
      ) => {
        const url =
          image.url
            ?.trim();

        const publicId =
          image.publicId
            ?.trim();

        if (
          !url ||
          !publicId
        ) {
          throw new Error(
            `${fieldName} image ${index + 1} requires url and publicId.`
          );
        }

        if (
          usedPublicIds.has(
            publicId
          )
        ) {
          throw new Error(
            `Duplicate image publicId in ${fieldName}: ${publicId}`
          );
        }

        usedPublicIds.add(
          publicId
        );

        return {
          url,
          publicId,
        };
      }
    );
  };

/* =========================================================
   NORMALIZE COLORS + SIZES
========================================================= */

const normalizeColors =
  (
    colors:
      | ProductColorInput[]
      | undefined
  ): IProductColor[] => {
    if (!colors) {
      return [];
    }

    if (
      !Array.isArray(
        colors
      )
    ) {
      throw new Error(
        "Colors must be an array."
      );
    }

    const usedColorSlugs =
      new Set<string>();

    const usedSkus =
      new Set<string>();

    return colors.map(
      (
        color,
        colorIndex
      ) => {
        const name =
          color.name
            ?.trim();

        if (!name) {
          throw new Error(
            `Color ${colorIndex + 1} name is required.`
          );
        }

        const slug =
          createSlug(
            color.slug
              ?.trim() ||
              name
          );

        if (
          usedColorSlugs.has(
            slug
          )
        ) {
          throw new Error(
            `Duplicate color: ${name}`
          );
        }

        usedColorSlugs.add(
          slug
        );

        const images =
          normalizeImages(
            color.images,
            `${name} color images`
          );

        const usedSizes =
          new Set<string>();

        const sizes =
          (
            color.sizes ||
            []
          ).map(
            (
              size,
              sizeIndex
            ) => {
              const sizeName =
                size.size
                  ?.trim()
                  .toUpperCase();

              const sku =
                size.sku
                  ?.trim()
                  .toUpperCase();

              if (!sizeName) {
                throw new Error(
                  `${name} size ${sizeIndex + 1} requires size name.`
                );
              }

              if (
                usedSizes.has(
                  sizeName
                )
              ) {
                throw new Error(
                  `Duplicate size ${sizeName} in color ${name}.`
                );
              }

              usedSizes.add(
                sizeName
              );

              if (!sku) {
                throw new Error(
                  `${name} / ${sizeName} requires SKU.`
                );
              }

              if (
                usedSkus.has(
                  sku
                )
              ) {
                throw new Error(
                  `Duplicate SKU inside product: ${sku}`
                );
              }

              usedSkus.add(
                sku
              );

              const stock =
                Number(
                  size.stock
                );

              if (
                !Number.isInteger(
                  stock
                ) ||
                stock < 0
              ) {
                throw new Error(
                  `Stock for ${name} / ${sizeName} must be a whole number 0 or greater.`
                );
              }

              return {
                size:
                  sizeName,

                sku,

                stock,

                isActive:
                  size.isActive ??
                  true,
              };
            }
          );

        return {
          name,

          slug,

          hex:
            color.hex
              ?.trim() ||
            "",

          images,

          sizes,

          isActive:
            color.isActive ??
            true,

          sortOrder:
            Number.isFinite(
              Number(
                color.sortOrder
              )
            )
              ? Number(
                  color.sortOrder
                )
              : 0,
        };
      }
    ) as IProductColor[];
  };

/* =========================================================
   GET SKUS
========================================================= */

const getSkusFromColors =
  (
    colors:
      | IProductColor[]
      | ProductColorInput[]
  ): string[] => {
    const skus:
      string[] =
      [];

    for (
      const color
      of colors
    ) {
      for (
        const size
        of color.sizes ||
        []
      ) {
        const sku =
          size.sku
            ?.trim()
            .toUpperCase();

        if (sku) {
          skus.push(
            sku
          );
        }
      }
    }

    return skus;
  };

/* =========================================================
   UNIQUE SKU ACROSS PRODUCTS
========================================================= */

const validateUniqueSkus =
  async (
    colors: IProductColor[],
    excludeProductId?: string
  ) => {
    const skus =
      getSkusFromColors(
        colors
      );

    if (
      skus.length === 0
    ) {
      return;
    }

    const query: Record<
      string,
      unknown
    > = {
      "colors.sizes.sku": {
        $in:
          skus,
      },
    };

    if (
      excludeProductId
    ) {
      query._id = {
        $ne:
          excludeProductId,
      };
    }

    const products =
      await Product.find(
        query
      )
        .select(
          "colors"
        )
        .lean();

    const requestedSkus =
      new Set(
        skus
      );

    for (
      const existing
      of products
    ) {
      const existingSkus =
        getSkusFromColors(
          existing.colors as IProductColor[]
        );

      const duplicate =
        existingSkus.find(
          (
            sku
          ) =>
            requestedSkus.has(
              sku
            )
        );

      if (duplicate) {
        throw new Error(
          `SKU already exists in another product: ${duplicate}`
        );
      }
    }
  };

/* =========================================================
   VALIDATE PRICES
========================================================= */

const validatePrices =
  ({
    price,
    compareAtPrice,
    costPrice,
  }: {
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
  }) => {
    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      throw new Error(
        "Product price must be 0 or greater."
      );
    }

    if (
      compareAtPrice !==
        undefined &&
      (
        !Number.isFinite(
          compareAtPrice
        ) ||
        compareAtPrice < 0
      )
    ) {
      throw new Error(
        "Compare at price must be 0 or greater."
      );
    }

    if (
      compareAtPrice !==
        undefined &&
      compareAtPrice > 0 &&
      compareAtPrice <
        price
    ) {
      throw new Error(
        "Compare at price cannot be lower than selling price."
      );
    }

    if (
      costPrice !==
        undefined &&
      (
        !Number.isFinite(
          costPrice
        ) ||
        costPrice < 0
      )
    ) {
      throw new Error(
        "Cost price must be 0 or greater."
      );
    }
  };

/* =========================================================
   VALIDATE PRODUCT STOCK
========================================================= */

const validateProductStock =
  (
    stock: number
  ): number => {
    if (
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      throw new Error(
        "Product stock must be a whole number 0 or greater."
      );
    }

    return stock;
  };

/* =========================================================
   NORMALIZE TAGS
========================================================= */

const normalizeTags =
  (
    tags:
      | string[]
      | undefined
  ) => {
    if (!tags) {
      return [];
    }

    if (
      !Array.isArray(
        tags
      )
    ) {
      throw new Error(
        "Tags must be an array."
      );
    }

    return [
      ...new Set(
        tags
          .map(
            (
              tag
            ) =>
              String(
                tag
              )
                .trim()
                .toLowerCase()
          )
          .filter(
            Boolean
          )
      ),
    ];
  };

/* =========================================================
   GET ALL PRODUCT IMAGE PUBLIC IDS

   mainImages[]
   +
   colors[].images[]
========================================================= */

const getProductImagePublicIds =
  (
    product: {
      mainImages?: {
        publicId?: string;
      }[];

      colors?: {
        images?: {
          publicId?: string;
        }[];
      }[];
    }
  ): string[] => {
    const ids:
      string[] =
      [];

    for (
      const image
      of product.mainImages ||
      []
    ) {
      if (
        image.publicId
      ) {
        ids.push(
          image.publicId
        );
      }
    }

    for (
      const color
      of product.colors ||
      []
    ) {
      for (
        const image
        of color.images ||
        []
      ) {
        if (
          image.publicId
        ) {
          ids.push(
            image.publicId
          );
        }
      }
    }

    return [
      ...new Set(
        ids
      ),
    ];
  };

/* =========================================================
   CLEAN EMPTY CLOUDINARY FOLDERS
========================================================= */

const cleanupCloudinaryFolders =
  async (
    publicIds: string[]
  ) => {
    const folders =
      [
        ...new Set(
          publicIds
            .map(
              getCloudinaryFolderFromPublicId
            )
            .filter(
              Boolean
            )
        ),
      ];

    await Promise.allSettled(
      folders.map(
        (
          folder
        ) =>
          deleteCloudinaryFolderIfEmpty(
            folder
          )
      )
    );
  };

/* =========================================================
   CREATE PRODUCT
========================================================= */

export const createProduct =
  async (
    input:
      CreateProductInput
  ) => {
    const name =
      input.name
        ?.trim();

    if (!name) {
      throw new Error(
        "Product name is required."
      );
    }

    const price =
      Number(
        input.price
      );

    const compareAtPrice =
      input.compareAtPrice !==
      undefined
        ? Number(
            input.compareAtPrice
          )
        : 0;

    const costPrice =
      input.costPrice !==
      undefined
        ? Number(
            input.costPrice
          )
        : 0;

    const stock =
      validateProductStock(
        Number(
          input.stock
        )
      );

    validatePrices({
      price,
      compareAtPrice,
      costPrice,
    });

    const categories =
      await validateCategories(
        input.categories
      );

    const slug =
      await resolveProductSlug(
        name,
        input.slug
      );

    const mainImages =
      normalizeImages(
        input.mainImages,
        "Product main images"
      );

    const colors =
      normalizeColors(
        input.colors
      );

    await validateUniqueSkus(
      colors
    );

    const product =
      await Product.create({
        name,

        slug,

        shortDescription:
          input.shortDescription
            ?.trim() ||
          "",

        description:
          sanitizeProductDescriptionHtml(
            input.description
          ),

        categories,

        price,

        compareAtPrice,

        costPrice,

        stock,

        mainImages,

        colors,

        /*
          Admin create API se rating set nahi karni.
          Reviews aane par Review service is summary ko update kare.
        */
        ratings: {
          average: 0,
          count: 0,
        },

        status:
          input.status ||
          "draft",

        isFeatured:
          input.isFeatured ??
          false,

        isNewLaunch:
          input.isNewLaunch ??
          false,

        tags:
          normalizeTags(
            input.tags
          ),

        seoTitle:
          input.seoTitle
            ?.trim() ||
          "",

        seoDescription:
          input.seoDescription
            ?.trim() ||
          "",
      });

    return product;
  };

/* =========================================================
   GET ALL PRODUCTS - ADMIN
========================================================= */

export const getAllProducts =
  async () => {
    return Product.find()
      .populate(
        "categories",
        "name slug level"
      )
      .sort({
        createdAt: -1,
      });
  };

/* =========================================================
   GET ACTIVE PRODUCTS - STOREFRONT
========================================================= */

export const getActiveProducts =
  async () => {
    return Product.find({
      status:
        "active",
    })
      .populate(
        "categories",
        "name slug level"
      )
      .sort({
        createdAt: -1,
      });
  };

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export const getProductById =
  async (
    productId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    const product =
      await Product.findById(
        productId
      ).populate(
        "categories",
        "name slug level"
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    return product;
  };

/* =========================================================
   GET PRODUCT BY SLUG
========================================================= */

export const getProductBySlug =
  async (
    slug: string
  ) => {
    const product =
      await Product.findOne({
        slug:
          slug
            .trim()
            .toLowerCase(),
      }).populate(
        "categories",
        "name slug level"
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    return product;
  };

/* =========================================================
   UPDATE PRODUCT

   Removed image cleanup:
   DB save first -> then removed Cloudinary images delete.
========================================================= */

export const updateProduct =
  async (
    productId: string,
    input:
      UpdateProductInput
  ) => {
    if (
      !Types.ObjectId.isValid(
        productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    const oldImageIds =
      getProductImagePublicIds(
        product
      );

    /* NAME + SLUG */

    if (
      input.name !==
      undefined
    ) {
      const name =
        input.name.trim();

      if (!name) {
        throw new Error(
          "Product name cannot be empty."
        );
      }

      product.name =
        name;
    }

    /* SLUG

       If slug field is supplied by admin:
       - non-empty -> use manual normalized unique slug
       - empty     -> auto generate from current product name

       If slug field is omitted entirely, existing slug is preserved.
    */

    if (
      input.slug !==
      undefined
    ) {
      product.slug =
        await resolveProductSlug(
          product.name,
          input.slug,
          productId
        );
    }

    /* DESCRIPTIONS */

    if (
      input.shortDescription !==
      undefined
    ) {
      product.shortDescription =
        input.shortDescription.trim();
    }

    if (
      input.description !==
      undefined
    ) {
      product.description =
        sanitizeProductDescriptionHtml(
          input.description
        );
    }

    /* CATEGORIES */

    if (
      input.categories !==
      undefined
    ) {
      product.categories =
        await validateCategories(
          input.categories
        );
    }

    /* PRICES */

    const nextPrice =
      input.price !==
      undefined
        ? Number(
            input.price
          )
        : product.price;

    const nextCompareAtPrice =
      input.compareAtPrice !==
      undefined
        ? Number(
            input.compareAtPrice
          )
        : product.compareAtPrice;

    const nextCostPrice =
      input.costPrice !==
      undefined
        ? Number(
            input.costPrice
          )
        : product.costPrice;

    const nextStock =
      input.stock !==
      undefined
        ? validateProductStock(
            Number(
              input.stock
            )
          )
        : product.stock;

    validatePrices({
      price:
        nextPrice,

      compareAtPrice:
        nextCompareAtPrice,

      costPrice:
        nextCostPrice,
    });

    product.price =
      nextPrice;

    product.compareAtPrice =
      nextCompareAtPrice;

    product.costPrice =
      nextCostPrice;

    product.stock =
      nextStock;

    /* MAIN IMAGES */

    if (
      input.mainImages !==
      undefined
    ) {
      product.mainImages =
        normalizeImages(
          input.mainImages,
          "Product main images"
        );
    }

    /* COLORS */

    if (
      input.colors !==
      undefined
    ) {
      const colors =
        normalizeColors(
          input.colors
        );

      await validateUniqueSkus(
        colors,
        productId
      );

      product.colors =
        colors;
    }

    /* STATUS */

    if (
      input.status !==
      undefined
    ) {
      product.status =
        input.status;
    }

    if (
      input.isFeatured !==
      undefined
    ) {
      product.isFeatured =
        input.isFeatured;
    }

    if (
      input.isNewLaunch !==
      undefined
    ) {
      product.isNewLaunch =
        input.isNewLaunch;
    }

    /* TAGS */

    if (
      input.tags !==
      undefined
    ) {
      product.tags =
        normalizeTags(
          input.tags
        );
    }

    /* SEO */

    if (
      input.seoTitle !==
      undefined
    ) {
      product.seoTitle =
        input.seoTitle.trim();
    }

    if (
      input.seoDescription !==
      undefined
    ) {
      product.seoDescription =
        input.seoDescription.trim();
    }

    /*
      ratings ko normal admin product update se touch nahi karna.
      Review service se hi update hoga.
    */

    await product.save();

    const newImageIds =
      new Set(
        getProductImagePublicIds(
          product
        )
      );

    const removedImageIds =
      oldImageIds.filter(
        (
          publicId
        ) =>
          !newImageIds.has(
            publicId
          )
      );

    if (
      removedImageIds.length >
      0
    ) {
      await deleteCloudinaryImages(
        removedImageIds
      );

      await cleanupCloudinaryFolders(
        removedImageIds
      );
    }

    return product;
  };

/* =========================================================
   UPDATE RATING SUMMARY

   Future Review service can call this after:
   - review create
   - review update
   - review delete
========================================================= */

export const updateProductRatingSummary =
  async (
    productId: string,
    average: number,
    count: number
  ) => {
    if (
      !Types.ObjectId.isValid(
        productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    const safeAverage =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            average
          ) ||
            0
        )
      );

    const safeCount =
      Math.max(
        0,
        Math.floor(
          Number(
            count
          ) ||
            0
        )
      );

    const product =
      await Product.findByIdAndUpdate(
        productId,
        {
          $set: {
            "ratings.average":
              Number(
                safeAverage.toFixed(
                  2
                )
              ),

            "ratings.count":
              safeCount,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    return product;
  };

/* =========================================================
   DELETE PRODUCT

   Deletes:
   - mainImages[]
   - colors[].images[]
   from Cloudinary first,
   then MongoDB product.
========================================================= */

export const deleteProduct =
  async (
    productId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    const publicIds =
      getProductImagePublicIds(
        product
      );

    if (
      publicIds.length >
      0
    ) {
      await deleteCloudinaryImages(
        publicIds
      );
    }

    await Product.deleteOne({
      _id:
        product._id,
    });

    await cleanupCloudinaryFolders(
      publicIds
    );

    return {
      message:
        "Product and product images deleted successfully.",

      deletedImages:
        publicIds.length,
    };
  };
