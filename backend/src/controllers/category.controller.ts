import {
  Request,
  Response,
} from "express";

import {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryTree,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

/* =========================================================
   HELPER - ROUTE PARAM
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

  if (Array.isArray(value)) {
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
   CREATE CATEGORY
========================================================= */

export const createCategoryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        description,
        parentId,
        image,
        isActive,
        sortOrder,
      } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Category name is required.",
          });
      }

      const category =
        await createCategory({
          name,
          description,
          parentId,
          image,
          isActive,
          sortOrder,
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Category created successfully.",

          category,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to create category.",
        });
    }
  };

/* =========================================================
   GET ALL CATEGORIES - ADMIN
========================================================= */

export const getAllCategoriesController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const categories =
        await getAllCategories();

      return res
        .status(200)
        .json({
          success: true,

          count:
            categories.length,

          categories,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to load categories.",
        });
    }
  };

/* =========================================================
   GET ACTIVE CATEGORIES - STOREFRONT
========================================================= */

export const getActiveCategoriesController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const categories =
        await getActiveCategories();

      return res
        .status(200)
        .json({
          success: true,

          count:
            categories.length,

          categories,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to load categories.",
        });
    }
  };

/* =========================================================
   GET CATEGORY TREE
========================================================= */

export const getCategoryTreeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const activeOnly =
        req.query.active ===
        "true";

      const categories =
        await getCategoryTree(
          activeOnly
        );

      return res
        .status(200)
        .json({
          success: true,
          categories,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to load category tree.",
        });
    }
  };

/* =========================================================
   GET CATEGORY BY ID
========================================================= */

export const getCategoryByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Category ID"
        );

      const category =
        await getCategoryById(
          id
        );

      return res
        .status(200)
        .json({
          success: true,
          category,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Category not found.",
        });
    }
  };

/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */

export const getCategoryBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Category slug"
        );

      const category =
        await getCategoryBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,
          category,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Category not found.",
        });
    }
  };

/* =========================================================
   UPDATE CATEGORY
========================================================= */

export const updateCategoryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Category ID"
        );

      const category =
        await updateCategory(
          id,
          {
            name:
              req.body.name,

            description:
              req.body
                .description,

            parentId:
              req.body.parentId,

            image:
              req.body.image,

            isActive:
              req.body.isActive,

            sortOrder:
              req.body.sortOrder,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Category updated successfully.",

          category,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to update category.",
        });
    }
  };

/* =========================================================
   DELETE CATEGORY
========================================================= */

export const deleteCategoryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Category ID"
        );

      const result =
        await deleteCategory(
          id
        );

      return res
        .status(200)
        .json({
          success: true,
          ...result,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to delete category.",
        });
    }
  };