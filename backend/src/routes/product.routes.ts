import {
  Router,
} from "express";

import authenticate from "../middleware/auth.middleware";

import requireAdmin from "../middleware/admin.middleware";

import {
  createProductController,
  getAllProductsController,
  getActiveProductsController,
  getCatalogProductsController,
  getCatalogProductBySlugController,
  getProductByIdController,
  getProductBySlugController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller";

const router =
  Router();

/* =========================================================
   PUBLIC / STOREFRONT

   IMPORTANT:
   static routes /active and /slug/:slug
   must come BEFORE /:id.
========================================================= */

router.get(
  "/active",
  getActiveProductsController
);

/*
  Clean API matching the requested product/color response shape.
  These routes intentionally do not include legacy price/SKU aliases.
*/
router.get(
  "/catalog",
  getCatalogProductsController
);

router.get(
  "/catalog/:slug",
  getCatalogProductBySlugController
);

router.get(
  "/slug/:slug",
  getProductBySlugController
);

/* =========================================================
   ADMIN
========================================================= */

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllProductsController
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  createProductController
);

router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getProductByIdController
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  updateProductController
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteProductController
);

export default router;
