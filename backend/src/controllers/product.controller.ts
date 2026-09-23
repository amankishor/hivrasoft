import {
  Request,
  Response,
} from "express";

import {
  createProduct,
  getAllProducts,
  getActiveProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  toStorefrontProduct,
  toCatalogProduct,
} from "../services/product.service";

/* =========================================================
   ROUTE PARAM HELPER
========================================================= */

const getRouteParam = (
  value:
    | string
    | string[]
    | undefined,
  paramName: string
): string => {
  if (!value) {
    throw new Error(
      `${paramName} is required.`
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    if (!value[0]) {
      throw new Error(
        `${paramName} is required.`
      );
    }

    return value[0];
  }

  return value;
};

/* =========================================================
   CREATE PRODUCT
========================================================= */

export const createProductController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
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
      } =
        req.body;

      if (
        !name ||
        !String(
          name
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Product name is required.",
          });
      }

      if (
        price ===
          undefined ||
        price ===
          null ||
        price ===
          ""
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Product price is required.",
          });
      }

      if (
        stock ===
          undefined ||
        stock ===
          null ||
        stock ===
          ""
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Product stock is required.",
          });
      }

      if (
        !Array.isArray(
          categories
        ) ||
        categories.length ===
          0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "At least one category is required.",
          });
      }

      const product =
        await createProduct({
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

          message:
            "Product created successfully.",

          product,
        });
    } catch (
      error
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to create product.",
        });
    }
  };

/* =========================================================
   GET ALL PRODUCTS - ADMIN
========================================================= */

export const getAllProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await getAllProducts();

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,

          data: products,
        });
    } catch (
      error
    ) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to load products.",
        });
    }
  };

/* =========================================================
   GET CATALOG PRODUCTS - CLEAN COLOR-CENTRIC API
========================================================= */

export const getCatalogProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const productDocuments =
        await getActiveProducts();

      const products =
        productDocuments.map(
          toCatalogProduct
        );

      return res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load catalog products.",
      });
    }
  };

export const getCatalogProductBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Product slug"
        );

      const product =
        await getProductBySlug(slug);

      const catalogProduct =
        toCatalogProduct(
          product
        );

      return res.status(200).json({
        success: true,
        count: 1,
        products: [
          catalogProduct,
        ],
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Product not found.",
      });
    }
  };

/* =========================================================
   GET ACTIVE PRODUCTS - STOREFRONT
========================================================= */

export const getActiveProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const productDocuments =
        await getActiveProducts();

      const products =
        productDocuments.map(
          toStorefrontProduct
        );

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,

          data: products,
        });
    } catch (
      error
    ) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to load products.",
        });
    }
  };

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export const getProductByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const product =
        await getProductById(
          id
        );

      return res
        .status(200)
        .json({
          success: true,
          product,
        });
    } catch (
      error
    ) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Product not found.",
        });
    }
  };

/* =========================================================
   GET PRODUCT BY SLUG
========================================================= */

export const getProductBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Product slug"
        );

      const productDocument =
        await getProductBySlug(
          slug
        );

      const product =
        toStorefrontProduct(
          productDocument
        );

      return res
        .status(200)
        .json({
          success: true,
          product,
        });
    } catch (
      error
    ) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Product not found.",
        });
    }
  };

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export const updateProductController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const product =
        await updateProduct(
          id,
          {
            name:
              req.body.name,

            slug:
              req.body.slug,

            shortDescription:
              req.body
                .shortDescription,

            description:
              req.body
                .description,

            categories:
              req.body
                .categories,

            price:
              req.body.price,

            compareAtPrice:
              req.body
                .compareAtPrice,

            costPrice:
              req.body
                .costPrice,

            stock:
              req.body.stock,

            mainImages:
              req.body
                .mainImages,

            isColor:
              req.body
                .isColor,

            colors:
              req.body.colors,

            status:
              req.body.status,

            isActive:
              req.body
                .isActive,

            isFeatured:
              req.body
                .isFeatured,

            isNewLaunch:
              req.body
                .isNewLaunch,

            tags:
              req.body.tags,

            seoTitle:
              req.body
                .seoTitle,

            seoDescription:
              req.body
                .seoDescription,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product updated successfully.",

          product,
        });
    } catch (
      error
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to update product.",
        });
    }
  };

/* =========================================================
   DELETE PRODUCT
========================================================= */

export const deleteProductController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const result =
        await deleteProduct(
          id
        );

      return res
        .status(200)
        .json({
          success: true,
          ...result,
        });
    } catch (
      error
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to delete product.",
        });
    }
  };
