"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProductRatingSummary = exports.updateProduct = exports.getProductBySlug = exports.getProductById = exports.getActiveProducts = exports.getAllProducts = exports.toCatalogProduct = exports.toStorefrontProduct = exports.createProduct = void 0;
const mongoose_1 = require("mongoose");
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const slug_1 = require("../utils/slug");
const productHtml_1 = require("../utils/productHtml");
const cloudinary_service_1 = require("./cloudinary.service");
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
const normalizeProductSlug = (value) => {
    /*
      Product slug supports letters/numbers from multiple languages.
      Spaces and symbols become hyphens.
    */
    const slug = String(value ||
        "")
        .normalize("NFKC")
        .toLowerCase()
        .trim()
        .replace(/&/g, " and ")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");
    if (!slug) {
        throw new Error("Product slug must contain at least one letter or number.");
    }
    return slug;
};
const isProductSlugTaken = async (slug, excludeId) => {
    const query = {
        slug,
    };
    if (excludeId) {
        query._id = {
            $ne: excludeId,
        };
    }
    const existing = await Product_model_1.default.findOne(query)
        .select("_id")
        .lean();
    return Boolean(existing);
};
const generateUniqueProductSlug = async (name, excludeId) => {
    const baseSlug = normalizeProductSlug(name);
    let slug = baseSlug;
    let counter = 2;
    while (await isProductSlugTaken(slug, excludeId)) {
        slug =
            `${baseSlug}-${counter}`;
        counter += 1;
    }
    return slug;
};
const resolveProductSlug = async (name, requestedSlug, excludeId) => {
    const rawSlug = requestedSlug
        ?.trim();
    if (!rawSlug) {
        return generateUniqueProductSlug(name, excludeId);
    }
    const slug = normalizeProductSlug(rawSlug);
    const duplicate = await isProductSlugTaken(slug, excludeId);
    if (duplicate) {
        throw new Error(`Product slug already exists: ${slug}`);
    }
    return slug;
};
/* =========================================================
   VALIDATE CATEGORIES
========================================================= */
const validateCategories = async (categoryIds) => {
    if (!Array.isArray(categoryIds) ||
        categoryIds.length ===
            0) {
        throw new Error("At least one category is required.");
    }
    const uniqueIds = [
        ...new Set(categoryIds.map(String)),
    ];
    for (const categoryId of uniqueIds) {
        if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
            throw new Error(`Invalid category ID: ${categoryId}`);
        }
    }
    const objectIds = uniqueIds.map((categoryId) => new mongoose_1.Types.ObjectId(categoryId));
    const count = await Category_model_1.default.countDocuments({
        _id: {
            $in: objectIds,
        },
    });
    if (count !==
        objectIds.length) {
        throw new Error("One or more selected categories do not exist.");
    }
    return objectIds;
};
/* =========================================================
   NORMALIZE IMAGES

   No hard application-level image count limit.
   This is used for mainImages[] and colors[].images[].
========================================================= */
const imageNameFromPublicId = (publicId) => publicId
    .split("/")
    .pop()
    ?.trim() ||
    "image";
const normalizeImages = (images, fieldName) => {
    if (!images) {
        return [];
    }
    if (!Array.isArray(images)) {
        throw new Error(`${fieldName} must be an array.`);
    }
    const usedPublicIds = new Set();
    const normalized = images.map((image, index) => {
        const url = image.url?.trim();
        const publicId = image.publicId?.trim();
        if (!url || !publicId) {
            throw new Error(`${fieldName} image ${index + 1} requires url and publicId.`);
        }
        if (usedPublicIds.has(publicId)) {
            throw new Error(`Duplicate image publicId in ${fieldName}: ${publicId}`);
        }
        usedPublicIds.add(publicId);
        const name = image.name?.trim() ||
            imageNameFromPublicId(publicId);
        return {
            url,
            publicId,
            name,
            alt: image.alt?.trim() ||
                name,
            isDefault: image.isDefault ??
                index === 0,
        };
    });
    if (normalized.length > 0) {
        const requestedDefault = normalized.findIndex(image => image.isDefault);
        const defaultIndex = requestedDefault >= 0
            ? requestedDefault
            : 0;
        normalized.forEach((image, index) => {
            image.isDefault =
                index === defaultIndex;
        });
    }
    return normalized;
};
/* =========================================================
   NORMALIZE COLORS + SIZES
========================================================= */
const normalizeColors = (colors) => {
    if (!colors) {
        return [];
    }
    if (!Array.isArray(colors)) {
        throw new Error("Colors must be an array.");
    }
    const usedColorSlugs = new Set();
    const usedProductSlugs = new Set();
    const usedSkus = new Set();
    const normalized = colors.map((color, colorIndex) => {
        const name = (color.nameColor ||
            color.name)?.trim();
        if (!name) {
            throw new Error(`Color ${colorIndex + 1} name is required.`);
        }
        const slug = (0, slug_1.createSlug)(color.slugColor?.trim() ||
            color.slug?.trim() ||
            name);
        if (usedColorSlugs.has(slug)) {
            throw new Error(`Duplicate color: ${name}`);
        }
        usedColorSlugs.add(slug);
        const slugProduct = color.slugProduct?.trim()
            ? normalizeProductSlug(color.slugProduct)
            : "";
        if (slugProduct &&
            usedProductSlugs.has(slugProduct)) {
            throw new Error(`Duplicate color product slug: ${slugProduct}`);
        }
        if (slugProduct) {
            usedProductSlugs.add(slugProduct);
        }
        const images = normalizeImages(color.images, `${name} color images`);
        const usedSizes = new Set();
        const sizes = (color.sizes || []).map((size, sizeIndex) => {
            const sizeName = size.size
                ?.trim()
                .toUpperCase();
            const sku = size.sku
                ?.trim()
                .toUpperCase();
            if (!sizeName) {
                throw new Error(`${name} size ${sizeIndex + 1} requires size name.`);
            }
            if (usedSizes.has(sizeName)) {
                throw new Error(`Duplicate size ${sizeName} in color ${name}.`);
            }
            usedSizes.add(sizeName);
            if (!sku) {
                throw new Error(`${name} / ${sizeName} requires SKU.`);
            }
            if (usedSkus.has(sku)) {
                throw new Error(`Duplicate SKU inside product: ${sku}`);
            }
            usedSkus.add(sku);
            const stock = Number(size.stock);
            if (!Number.isInteger(stock) ||
                stock < 0) {
                throw new Error(`Stock for ${name} / ${sizeName} must be a whole number 0 or greater.`);
            }
            return {
                size: sizeName,
                sku,
                stock,
                isActive: size.isActive ??
                    true,
            };
        });
        const tags = Array.isArray(color.tags)
            ? [
                ...new Set(color.tags
                    .map(tag => String(tag)
                    .trim()
                    .toLowerCase())
                    .filter(Boolean)),
            ]
            : [];
        return {
            name,
            slug,
            nameProduct: color.nameProduct?.trim() ||
                "",
            slugProduct,
            nameColor: name,
            slugColor: slug,
            hex: color.hex?.trim() ||
                "",
            isDefault: color.isDefault ??
                colorIndex === 0,
            shortDescription: color.shortDescription?.trim() ||
                "",
            description: (0, productHtml_1.sanitizeProductDescriptionHtml)(color.description),
            tags,
            seoTitle: color.seoTitle?.trim() ||
                "",
            seoDescription: color.seoDescription?.trim() ||
                "",
            images,
            sizes,
            isActive: color.isActive ??
                true,
            sortOrder: Number.isFinite(Number(color.sortOrder))
                ? Number(color.sortOrder)
                : colorIndex,
        };
    });
    if (normalized.length > 0) {
        const requestedDefault = normalized.findIndex(color => color.isDefault);
        const defaultIndex = requestedDefault >= 0
            ? requestedDefault
            : 0;
        normalized.forEach((color, index) => {
            color.isDefault =
                index === defaultIndex;
        });
    }
    return normalized;
};
/* =========================================================
   GET SKUS
========================================================= */
const getSkusFromColors = (colors) => {
    const skus = [];
    for (const color of colors) {
        for (const size of color.sizes ||
            []) {
            const sku = size.sku
                ?.trim()
                .toUpperCase();
            if (sku) {
                skus.push(sku);
            }
        }
    }
    return skus;
};
/* =========================================================
   UNIQUE SKU ACROSS PRODUCTS
========================================================= */
const validateUniqueSkus = async (colors, excludeProductId) => {
    const skus = getSkusFromColors(colors);
    if (skus.length === 0) {
        return;
    }
    const query = {
        "colors.sizes.sku": {
            $in: skus,
        },
    };
    if (excludeProductId) {
        query._id = {
            $ne: excludeProductId,
        };
    }
    const products = await Product_model_1.default.find(query)
        .select("colors")
        .lean();
    const requestedSkus = new Set(skus);
    for (const existing of products) {
        const existingSkus = getSkusFromColors(existing.colors);
        const duplicate = existingSkus.find((sku) => requestedSkus.has(sku));
        if (duplicate) {
            throw new Error(`SKU already exists in another product: ${duplicate}`);
        }
    }
};
/* =========================================================
   VALIDATE PRICES
========================================================= */
const validatePrices = ({ price, compareAtPrice, costPrice, }) => {
    if (!Number.isFinite(price) ||
        price < 0) {
        throw new Error("Product price must be 0 or greater.");
    }
    if (compareAtPrice !==
        undefined &&
        (!Number.isFinite(compareAtPrice) ||
            compareAtPrice < 0)) {
        throw new Error("Compare at price must be 0 or greater.");
    }
    if (compareAtPrice !==
        undefined &&
        compareAtPrice > 0 &&
        compareAtPrice <
            price) {
        throw new Error("Compare at price cannot be lower than selling price.");
    }
    if (costPrice !==
        undefined &&
        (!Number.isFinite(costPrice) ||
            costPrice < 0)) {
        throw new Error("Cost price must be 0 or greater.");
    }
};
/* =========================================================
   VALIDATE PRODUCT STOCK
========================================================= */
const validateProductStock = (stock) => {
    if (!Number.isInteger(stock) ||
        stock < 0) {
        throw new Error("Product stock must be a whole number 0 or greater.");
    }
    return stock;
};
/* =========================================================
   NORMALIZE TAGS
========================================================= */
const normalizeTags = (tags) => {
    if (!tags) {
        return [];
    }
    if (!Array.isArray(tags)) {
        throw new Error("Tags must be an array.");
    }
    return [
        ...new Set(tags
            .map((tag) => String(tag)
            .trim()
            .toLowerCase())
            .filter(Boolean)),
    ];
};
/* =========================================================
   GET ALL PRODUCT IMAGE PUBLIC IDS

   mainImages[]
   +
   colors[].images[]
========================================================= */
const getProductImagePublicIds = (product) => {
    const ids = [];
    for (const image of product.mainImages ||
        []) {
        if (image.publicId) {
            ids.push(image.publicId);
        }
    }
    for (const color of product.colors ||
        []) {
        for (const image of color.images ||
            []) {
            if (image.publicId) {
                ids.push(image.publicId);
            }
        }
    }
    return [
        ...new Set(ids),
    ];
};
/* =========================================================
   CLEAN EMPTY CLOUDINARY FOLDERS
========================================================= */
const cleanupCloudinaryFolders = async (publicIds) => {
    const folders = [
        ...new Set(publicIds
            .map(cloudinary_service_1.getCloudinaryFolderFromPublicId)
            .filter(Boolean)),
    ];
    await Promise.allSettled(folders.map((folder) => (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder)));
};
/* =========================================================
   CREATE PRODUCT
========================================================= */
const createProduct = async (input) => {
    const name = input.name
        ?.trim();
    if (!name) {
        throw new Error("Product name is required.");
    }
    const price = Number(input.price);
    const compareAtPrice = input.compareAtPrice !==
        undefined
        ? Number(input.compareAtPrice)
        : 0;
    const costPrice = input.costPrice !==
        undefined
        ? Number(input.costPrice)
        : 0;
    const stock = validateProductStock(Number(input.stock));
    validatePrices({
        price,
        compareAtPrice,
        costPrice,
    });
    const categories = await validateCategories(input.categories);
    const slug = await resolveProductSlug(name, input.slug);
    const mainImages = normalizeImages(input.mainImages, "Product main images");
    const colors = normalizeColors(input.colors);
    await validateUniqueSkus(colors);
    const status = input.status ||
        (input.isActive
            ? "active"
            : "draft");
    const product = await Product_model_1.default.create({
        name,
        slug,
        shortDescription: input.shortDescription
            ?.trim() ||
            "",
        description: (0, productHtml_1.sanitizeProductDescriptionHtml)(input.description),
        categories,
        price,
        compareAtPrice,
        costPrice,
        stock,
        mainImages,
        isColor: input.isColor ??
            colors.length > 0,
        colors,
        /*
          Admin create API se rating set nahi karni.
          Reviews aane par Review service is summary ko update kare.
        */
        ratings: {
            average: 0,
            count: 0,
        },
        status,
        isActive: status ===
            "active",
        isFeatured: input.isFeatured ??
            false,
        isNewLaunch: input.isNewLaunch ??
            false,
        tags: normalizeTags(input.tags),
        seoTitle: input.seoTitle
            ?.trim() ||
            "",
        seoDescription: input.seoDescription
            ?.trim() ||
            "",
    });
    return product;
};
exports.createProduct = createProduct;
/* =========================================================
   STOREFRONT PRODUCT DTO

   Adds the color-centric API requested by the storefront while
   retaining legacy commerce fields so existing cart/listing code
   continues to work.
========================================================= */
const toStorefrontProduct = (productInput) => {
    const product = typeof productInput?.toObject ===
        "function"
        ? productInput.toObject()
        : productInput;
    const mainImages = Array.isArray(product.mainImages)
        ? product.mainImages.map((image, index) => ({
            url: image.url,
            publicId: image.publicId,
            name: image.name ||
                imageNameFromPublicId(image.publicId ||
                    "image"),
            alt: image.alt ||
                image.name ||
                product.name ||
                "Product image",
            isDefault: image.isDefault ??
                index === 0,
        }))
        : [];
    const colors = Array.isArray(product.colors)
        ? product.colors.map((color, index) => {
            const nameColor = color.nameColor ||
                color.name ||
                "";
            const slugColor = color.slugColor ||
                color.slug ||
                (0, slug_1.createSlug)(nameColor);
            const isDefault = color.isDefault ??
                index === 0;
            const colorImages = Array.isArray(color.images) &&
                color.images.length > 0
                ? color.images
                : isDefault
                    ? mainImages
                    : [];
            return {
                _id: color._id,
                nameProduct: color.nameProduct ||
                    product.name ||
                    "",
                slugProduct: color.slugProduct ||
                    (isDefault
                        ? product.slug
                        : `${product.slug}-${slugColor}`),
                nameColor,
                slugColor,
                hex: color.hex || "",
                isDefault,
                shortDescription: color.shortDescription ||
                    product.shortDescription ||
                    "",
                description: color.description ||
                    product.description ||
                    "",
                tags: Array.isArray(color.tags) &&
                    color.tags.length > 0
                    ? color.tags
                    : product.tags || [],
                seoTitle: color.seoTitle ||
                    product.seoTitle ||
                    "",
                seoDescription: color.seoDescription ||
                    product.seoDescription ||
                    "",
                images: colorImages.map((image, imageIndex) => ({
                    url: image.url,
                    publicId: image.publicId,
                    name: image.name ||
                        imageNameFromPublicId(image.publicId ||
                            "image"),
                    alt: image.alt ||
                        image.name ||
                        color.nameProduct ||
                        product.name ||
                        "Product image",
                    isDefault: image.isDefault ??
                        imageIndex === 0,
                })),
                sizes: Array.isArray(color.sizes)
                    ? color.sizes.map((size) => ({
                        _id: size._id,
                        size: size.size,
                        stock: size.stock,
                        isActive: size.isActive !==
                            false,
                        /* Kept for cart compatibility; UI may ignore it. */
                        sku: size.sku,
                    }))
                    : [],
                isActive: color.isActive !==
                    false,
                /* Legacy aliases used by current components. */
                name: nameColor,
                slug: slugColor,
                sortOrder: color.sortOrder ??
                    index,
            };
        })
        : [];
    return {
        _id: product._id,
        ratings: product.ratings || { average: 0, count: 0 },
        categories: product.categories || [],
        isColor: product.isColor ??
            colors.length > 0,
        colors,
        isActive: product.isActive ??
            product.status ===
                "active",
        isFeatured: Boolean(product.isFeatured),
        isNewLaunch: Boolean(product.isNewLaunch),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        /* Legacy commerce fields intentionally retained. */
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        stock: product.stock,
        mainImages,
        status: product.status,
        tags: product.tags || [],
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
    };
};
exports.toStorefrontProduct = toStorefrontProduct;
const toCatalogProduct = (productInput) => {
    const product = (0, exports.toStorefrontProduct)(productInput);
    return {
        _id: product._id,
        ratings: product.ratings,
        categories: product.categories,
        isColor: product.isColor,
        colors: product.colors.map((color) => ({
            nameProduct: color.nameProduct,
            slugProduct: color.slugProduct,
            nameColor: color.nameColor,
            slugColor: color.slugColor,
            hex: color.hex,
            isDefault: color.isDefault,
            shortDescription: color.shortDescription,
            description: color.description,
            tags: color.tags,
            seoTitle: color.seoTitle,
            seoDescription: color.seoDescription,
            images: color.images.map((image) => ({
                url: image.url,
                publicId: image.publicId,
                name: image.name,
                alt: image.alt,
                isDefault: image.isDefault,
            })),
            sizes: color.sizes.map((size) => ({
                _id: size._id,
                size: size.size,
                stock: size.stock,
                isActive: size.isActive,
            })),
        })),
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isNewLaunch: product.isNewLaunch,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
};
exports.toCatalogProduct = toCatalogProduct;
/* =========================================================
   GET ALL PRODUCTS - ADMIN
========================================================= */
const getAllProducts = async () => {
    return Product_model_1.default.find()
        .populate("categories", "name slug level")
        .sort({
        createdAt: -1,
    });
};
exports.getAllProducts = getAllProducts;
/* =========================================================
   GET ACTIVE PRODUCTS - STOREFRONT
========================================================= */
const getActiveProducts = async () => {
    return Product_model_1.default.find({
        $or: [
            { status: "active" },
            { isActive: true },
        ],
    })
        .populate("categories", "name slug level")
        .sort({
        createdAt: -1,
    });
};
exports.getActiveProducts = getActiveProducts;
/* =========================================================
   GET PRODUCT BY ID
========================================================= */
const getProductById = async (productId) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId).populate("categories", "name slug level");
    if (!product) {
        throw new Error("Product not found.");
    }
    return product;
};
exports.getProductById = getProductById;
/* =========================================================
   GET PRODUCT BY SLUG
========================================================= */
const getProductBySlug = async (slug) => {
    const normalizedSlug = slug
        .trim()
        .toLowerCase();
    const product = await Product_model_1.default.findOne({
        $or: [
            { slug: normalizedSlug },
            {
                "colors.slugProduct": normalizedSlug,
            },
        ],
    }).populate("categories", "name slug level");
    if (!product) {
        throw new Error("Product not found.");
    }
    return product;
};
exports.getProductBySlug = getProductBySlug;
/* =========================================================
   UPDATE PRODUCT

   Removed image cleanup:
   DB save first -> then removed Cloudinary images delete.
========================================================= */
const updateProduct = async (productId, input) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const oldImageIds = getProductImagePublicIds(product);
    /* NAME + SLUG */
    if (input.name !==
        undefined) {
        const name = input.name.trim();
        if (!name) {
            throw new Error("Product name cannot be empty.");
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
    if (input.slug !==
        undefined) {
        product.slug =
            await resolveProductSlug(product.name, input.slug, productId);
    }
    /* DESCRIPTIONS */
    if (input.shortDescription !==
        undefined) {
        product.shortDescription =
            input.shortDescription.trim();
    }
    if (input.description !==
        undefined) {
        product.description =
            (0, productHtml_1.sanitizeProductDescriptionHtml)(input.description);
    }
    /* CATEGORIES */
    if (input.categories !==
        undefined) {
        product.categories =
            await validateCategories(input.categories);
    }
    /* PRICES */
    const nextPrice = input.price !==
        undefined
        ? Number(input.price)
        : product.price;
    const nextCompareAtPrice = input.compareAtPrice !==
        undefined
        ? Number(input.compareAtPrice)
        : product.compareAtPrice;
    const nextCostPrice = input.costPrice !==
        undefined
        ? Number(input.costPrice)
        : product.costPrice;
    const nextStock = input.stock !==
        undefined
        ? validateProductStock(Number(input.stock))
        : product.stock;
    validatePrices({
        price: nextPrice,
        compareAtPrice: nextCompareAtPrice,
        costPrice: nextCostPrice,
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
    if (input.mainImages !==
        undefined) {
        product.mainImages =
            normalizeImages(input.mainImages, "Product main images");
    }
    /* COLORS */
    if (input.colors !==
        undefined) {
        const colors = normalizeColors(input.colors);
        await validateUniqueSkus(colors, productId);
        product.colors =
            colors;
    }
    /* COLOR / STATUS */
    if (input.isColor !==
        undefined) {
        product.isColor =
            input.isColor;
    }
    if (input.status !==
        undefined) {
        product.status =
            input.status;
    }
    else if (input.isActive !==
        undefined) {
        product.status =
            input.isActive
                ? "active"
                : "inactive";
    }
    product.isActive =
        product.status ===
            "active";
    if (input.isFeatured !==
        undefined) {
        product.isFeatured =
            input.isFeatured;
    }
    if (input.isNewLaunch !==
        undefined) {
        product.isNewLaunch =
            input.isNewLaunch;
    }
    /* TAGS */
    if (input.tags !==
        undefined) {
        product.tags =
            normalizeTags(input.tags);
    }
    /* SEO */
    if (input.seoTitle !==
        undefined) {
        product.seoTitle =
            input.seoTitle.trim();
    }
    if (input.seoDescription !==
        undefined) {
        product.seoDescription =
            input.seoDescription.trim();
    }
    /*
      ratings ko normal admin product update se touch nahi karna.
      Review service se hi update hoga.
    */
    await product.save();
    const newImageIds = new Set(getProductImagePublicIds(product));
    const removedImageIds = oldImageIds.filter((publicId) => !newImageIds.has(publicId));
    if (removedImageIds.length >
        0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(removedImageIds);
        await cleanupCloudinaryFolders(removedImageIds);
    }
    return product;
};
exports.updateProduct = updateProduct;
/* =========================================================
   UPDATE RATING SUMMARY

   Future Review service can call this after:
   - review create
   - review update
   - review delete
========================================================= */
const updateProductRatingSummary = async (productId, average, count) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const safeAverage = Math.max(0, Math.min(5, Number(average) ||
        0));
    const safeCount = Math.max(0, Math.floor(Number(count) ||
        0));
    const product = await Product_model_1.default.findByIdAndUpdate(productId, {
        $set: {
            "ratings.average": Number(safeAverage.toFixed(2)),
            "ratings.count": safeCount,
        },
    }, {
        new: true,
        runValidators: true,
    });
    if (!product) {
        throw new Error("Product not found.");
    }
    return product;
};
exports.updateProductRatingSummary = updateProductRatingSummary;
/* =========================================================
   DELETE PRODUCT

   Deletes:
   - mainImages[]
   - colors[].images[]
   from Cloudinary first,
   then MongoDB product.
========================================================= */
const deleteProduct = async (productId) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const publicIds = getProductImagePublicIds(product);
    if (publicIds.length >
        0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(publicIds);
    }
    await Product_model_1.default.deleteOne({
        _id: product._id,
    });
    await cleanupCloudinaryFolders(publicIds);
    return {
        message: "Product and product images deleted successfully.",
        deletedImages: publicIds.length,
    };
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.service.js.map