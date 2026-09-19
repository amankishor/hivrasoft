"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductController = exports.updateProductController = exports.getProductBySlugController = exports.getProductByIdController = exports.getActiveProductsController = exports.getAllProductsController = exports.createProductController = void 0;
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
        const { name, shortDescription, description, categories, price, compareAtPrice, costPrice, mainImages, colors, status, isFeatured, isNewLaunch, tags, seoTitle, seoDescription, } = req.body;
        if (!name) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Product name is required.",
            });
        }
        if (price ===
            undefined ||
            price === null) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Product price is required.",
            });
        }
        if (!Array.isArray(categories) ||
            categories.length === 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "At least one category is required.",
            });
        }
        const product = await (0, product_service_1.createProduct)({
            name,
            shortDescription,
            description,
            categories,
            price,
            compareAtPrice,
            costPrice,
            mainImages,
            colors,
            status,
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
const getAllProductsController = async (req, res) => {
    try {
        const products = await (0, product_service_1.getAllProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
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
   GET ACTIVE PRODUCTS - STOREFRONT
========================================================= */
const getActiveProductsController = async (req, res) => {
    try {
        const products = await (0, product_service_1.getActiveProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
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
        const product = await (0, product_service_1.getProductBySlug)(slug);
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
            mainImages: req.body
                .mainImages,
            colors: req.body.colors,
            status: req.body.status,
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