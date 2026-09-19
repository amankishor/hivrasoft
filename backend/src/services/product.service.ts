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

  shortDescription?: string;

  description?: string;

  categories: string[];

  price: number;

  compareAtPrice?: number;

  costPrice?: number;

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
   UNIQUE PRODUCT SLUG
========================================================= */

const generateUniqueProductSlug =
  async (
    name: string,
    excludeId?: string
  ): Promise<string> => {
    const baseSlug =
      createSlug(name);

    let slug =
      baseSlug;

    let counter =
      2;

    while (true) {
      const query: Record<
        string,
        unknown
      > = {
        slug,
      };

      if (excludeId) {
        query._id = {
          $ne: excludeId,
        };
      }

      const existing =
        await Product.findOne(
          query
        )
          .select("_id")
          .lean();

      if (!existing) {
        return slug;
      }

      slug =
        `${baseSlug}-${counter}`;

      counter += 1;
    }
  };

/* =========================================================
   VALIDATE CATEGORY IDS
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

    const uniqueCategoryIds =
      [
        ...new Set(
          categoryIds
        ),
      ];

    for (
      const categoryId
      of uniqueCategoryIds
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
      uniqueCategoryIds.map(
        (categoryId) =>
          new Types.ObjectId(
            categoryId
          )
      );

    const categoryCount =
      await Category.countDocuments(
        {
          _id: {
            $in:
              objectIds,
          },
        }
      );

    if (
      categoryCount !==
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
========================================================= */

const normalizeImages = (
  images:
    | ProductImageInput[]
    | undefined,
  maxImages: number,
  fieldName: string
): IProductImage[] => {
  if (!images) {
    return [];
  }

  if (
    images.length >
    maxImages
  ) {
    throw new Error(
      `${fieldName} can contain maximum ${maxImages} images.`
    );
  }

  return images.map(
    (
      image,
      index
    ) => {
      const url =
        image.url?.trim();

      const publicId =
        image.publicId?.trim();

      if (
        !url ||
        !publicId
      ) {
        throw new Error(
          `${fieldName} image ${index + 1} requires url and publicId.`
        );
      }

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

const normalizeColors = (
  colors:
    | ProductColorInput[]
    | undefined
): IProductColor[] => {
  if (!colors) {
    return [];
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
        color.name?.trim();

      if (!name) {
        throw new Error(
          `Color ${colorIndex + 1} name is required.`
        );
      }

      const slug =
        createSlug(
          color.slug?.trim() ||
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
          2,
          `${name} color`
        );

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

            if (
              !sizeName
            ) {
              throw new Error(
                `${name} size ${sizeIndex + 1} requires size name.`
              );
            }

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
   GET ALL SKUS FROM COLORS
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
   VALIDATE SKU AGAINST OTHER PRODUCTS
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
        $in: skus,
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

    const existingProduct =
      await Product.findOne(
        query
      )
        .select(
          "name colors"
        );

    if (
      !existingProduct
    ) {
      return;
    }

    const existingSkus =
      new Set(
        getSkusFromColors(
          existingProduct.colors
        )
      );

    const duplicateSku =
      skus.find(
        (sku) =>
          existingSkus.has(
            sku
          )
      );

    if (
      duplicateSku
    ) {
      throw new Error(
        `SKU already exists in another product: ${duplicateSku}`
      );
    }
  };

/* =========================================================
   VALIDATE PRICES
========================================================= */

const validatePrices = ({
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
      await generateUniqueProductSlug(
        name
      );

    const mainImages =
      normalizeImages(
        input.mainImages,
        4,
        "Product main images"
      );

    const colors =
      normalizeColors(
        input.colors
      );

    await validateUniqueSkus(
      colors
    );

    const tags =
      [
        ...new Set(
          (
            input.tags ||
            []
          )
            .map(
              (tag) =>
                tag
                  .trim()
                  .toLowerCase()
            )
            .filter(Boolean)
        ),
      ];

    const product =
      await Product.create({
        name,

        slug,

        shortDescription:
          input.shortDescription
            ?.trim() ||
          "",

        description:
          input.description
            ?.trim() ||
          "",

        categories,

        price,

        compareAtPrice,

        costPrice,

        mainImages,

        colors,

        status:
          input.status ||
          "draft",

        isFeatured:
          input.isFeatured ??
          false,

        isNewLaunch:
          input.isNewLaunch ??
          false,

        tags,

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

      product.slug =
        await generateUniqueProductSlug(
          name,
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
        input.description.trim();
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

    /* MAIN IMAGES */

    if (
      input.mainImages !==
      undefined
    ) {
      product.mainImages =
        normalizeImages(
          input.mainImages,
          4,
          "Product main images"
        );
    }

    /* COLORS + SKU */

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
        [
          ...new Set(
            input.tags
              .map(
                (tag) =>
                  tag
                    .trim()
                    .toLowerCase()
              )
              .filter(Boolean)
          ),
        ];
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

    await product.save();

    return product;
  };

/* =========================================================
   DELETE PRODUCT

   Cloudinary / placements / cart cleanup later add hoga.
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

    await Product.deleteOne({
      _id:
        product._id,
    });

    return {
      message:
        "Product deleted successfully.",
    };
  };