"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductController = exports.updateProductController = exports.getProductBySlugController = exports.getProductByIdController = exports.getActiveProductsController = exports.getCatalogProductBySlugController = exports.getCatalogProductsController = exports.getAllProductsController = exports.createProductController = void 0;
const product_service_1 = require("../services/product.service");
/* =========================================================
   ROUTE PARAM HELPER
========================================================= */
const getRouteParam = (value, paramName) => {
    if (!value) {
        throw new Error(`${paramName} is required.`);
    }
    if (Array.isArray(value)) {
        if (!value[0]) {
            throw new Error(`${paramName} is required.`);
        }
        return value[0];
    }
    return value;
};
/* =========================================================
   CREATE PRODUCT
========================================================= */
const createProductController = async (req, res) => {
    try {
        const { name, slug, shortDescription, description, categories, price, compareAtPrice, costPrice, stock, mainImages, isColor, colors, status, isActive, isFeatured, isNewLaunch, tags, seoTitle, seoDescription, } = req.body;
        if (!name ||
            !String(name).trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Product name is required.",
            });
        }
        if (price ===
            undefined ||
            price ===
                null ||
            price ===
                "") {
            return res
                .status(400)
                .json({
                success: false,
                message: "Product price is required.",
            });
        }
        if (stock ===
            undefined ||
            stock ===
                null ||
            stock ===
                "") {
            return res
                .status(400)
                .json({
                success: false,
                message: "Product stock is required.",
            });
        }
        if (!Array.isArray(categories) ||
            categories.length ===
                0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "At least one category is required.",
            });
        }
        const product = await (0, product_service_1.createProduct)({
            name,
            slug,
            shortDescription,
            description,
            categories,
            price,
            compareAtPrice,
            costPrice,
            stock,
            mainImages,
            isColor,
            colors,
            status,
            isActive,
            isFeatured,
            isNewLaunch,
            tags,
            seoTitle,
            seoDescription,
        });
        return res
            .status(201)
            .json({
            success: true,
            message: "Product created successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to create product.",
        });
    }
};
exports.createProductController = createProductController;
/* =========================================================
   GET ALL PRODUCTS - ADMIN
========================================================= */
const getAllProductsController = async (_req, res) => {
    try {
        const products = await (0, product_service_1.getAllProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
            data: products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to load products.",
        });
    }
};
exports.getAllProductsController = getAllProductsController;
/* =========================================================
   GET CATALOG PRODUCTS - CLEAN COLOR-CENTRIC API
========================================================= */
const getCatalogProductsController = async (_req, res) => {
    try {
        const productDocuments = await (0, product_service_1.getActiveProducts)();
        const products = productDocuments.map(product_service_1.toCatalogProduct);
        return res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to load catalog products.",
        });
    }
};
exports.getCatalogProductsController = getCatalogProductsController;
const getCatalogProductBySlugController = async (req, res) => {
    try {
        const slug = getRouteParam(req.params.slug, "Product slug");
        const product = await (0, product_service_1.getProductBySlug)(slug);
        return res.status(200).json({
            success: true,
            product: (0, product_service_1.toCatalogProduct)(product),
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Product not found.",
        });
    }
};
exports.getCatalogProductBySlugController = getCatalogProductBySlugController;
/* =========================================================
   GET ACTIVE PRODUCTS - STOREFRONT
========================================================= */
const getActiveProductsController = async (_req, res) => {
    try {
        const productDocuments = await (0, product_service_1.getActiveProducts)();
        const products = productDocuments.map(product_service_1.toStorefrontProduct);
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
            data: products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to load products.",
        });
    }
};
exports.getActiveProductsController = getActiveProductsController;
/* =========================================================
   GET PRODUCT BY ID
========================================================= */
const getProductByIdController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const product = await (0, product_service_1.getProductById)(id);
        return res
            .status(200)
            .json({
            success: true,
            product,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Product not found.",
        });
    }
};
exports.getProductByIdController = getProductByIdController;
/* =========================================================
   GET PRODUCT BY SLUG
========================================================= */
const getProductBySlugController = async (req, res) => {
    try {
        const slug = getRouteParam(req.params.slug, "Product slug");
        const productDocument = await (0, product_service_1.getProductBySlug)(slug);
        const product = (0, product_service_1.toStorefrontProduct)(productDocument);
        return res
            .status(200)
            .json({
            success: true,
            product,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Product not found.",
        });
    }
};
exports.getProductBySlugController = getProductBySlugController;
/* =========================================================
   UPDATE PRODUCT
========================================================= */
const updateProductController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const product = await (0, product_service_1.updateProduct)(id, {
            name: req.body.name,
            slug: req.body.slug,
            shortDescription: req.body
                .shortDescription,
            description: req.body
                .description,
            categories: req.body
                .categories,
            price: req.body.price,
            compareAtPrice: req.body
                .compareAtPrice,
            costPrice: req.body
                .costPrice,
            stock: req.body.stock,
            mainImages: req.body
                .mainImages,
            isColor: req.body
                .isColor,
            colors: req.body.colors,
            status: req.body.status,
            isActive: req.body
                .isActive,
            isFeatured: req.body
                .isFeatured,
            isNewLaunch: req.body
                .isNewLaunch,
            tags: req.body.tags,
            seoTitle: req.body
                .seoTitle,
            seoDescription: req.body
                .seoDescription,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Product updated successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to update product.",
        });
    }
};
exports.updateProductController = updateProductController;
/* =========================================================
   DELETE PRODUCT
========================================================= */
const deleteProductController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const result = await (0, product_service_1.deleteProduct)(id);
        return res
            .status(200)
            .json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to delete product.",
        });
    }
};
exports.deleteProductController = deleteProductController;
//# sourceMappingURL=product.controller.js.map