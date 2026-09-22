import {
  Router,
} from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

import {
  createProductController,
  getAllProductsController,
  getActiveProductsController,
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
