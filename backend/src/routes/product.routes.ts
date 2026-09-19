import {
  Router,
} from "express";

import {
  createProductController,
  getAllProductsController,
  getActiveProductsController,
  getProductByIdController,
  getProductBySlugController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

const router =
  Router();

/* =========================================================
   PUBLIC / STOREFRONT ROUTES
========================================================= */

/*
GET
/api/products/active
*/

router.get(
  "/active",
  getActiveProductsController
);

/*
GET
/api/products/slug/everyday-sports-bra
*/

router.get(
  "/slug/:slug",
  getProductBySlugController
);

/*
GET
/api/products/:id
*/

router.get(
  "/:id",
  getProductByIdController
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

/*
GET
/api/products

All products:
draft + active + inactive
*/

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllProductsController
);

/*
POST
/api/products
*/

router.post(
  "/",
  authenticate,
  requireAdmin,
  createProductController
);

/*
PATCH
/api/products/:id
*/

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  updateProductController
);

/*
DELETE
/api/products/:id
*/

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteProductController
);

export default router;