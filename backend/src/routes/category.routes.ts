import {
  Router,
} from "express";

import {
  createCategoryController,
  getAllCategoriesController,
  getActiveCategoriesController,
  getCategoryTreeController,
  getCategoryByIdController,
  getCategoryBySlugController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

const router = Router();

/* =========================================================
   PUBLIC CATEGORY ROUTES
========================================================= */

/* Storefront active categories */

router.get(
  "/active",
  getActiveCategoriesController
);

/* Category tree

   /api/categories/tree
   /api/categories/tree?active=true
*/

router.get(
  "/tree",
  getCategoryTreeController
);

/* Find category by slug */

router.get(
  "/slug/:slug",
  getCategoryBySlugController
);

/* =========================================================
   ADMIN CATEGORY ROUTES
========================================================= */

/* All categories including disabled */

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllCategoriesController
);

/* Create */

router.post(
  "/",
  authenticate,
  requireAdmin,
  createCategoryController
);

/* Update */

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  updateCategoryController
);

/* Delete */

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteCategoryController
);

/* =========================================================
   CATEGORY BY ID
   IMPORTANT: :id route last me hi rahe
========================================================= */

router.get(
  "/:id",
  getCategoryByIdController
);

export default router;