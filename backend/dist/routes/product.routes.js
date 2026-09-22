"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = (0, express_1.Router)();
/* =========================================================
   PUBLIC / STOREFRONT ROUTES
========================================================= */
/*
GET
/api/products/active
*/
router.get("/active", product_controller_1.getActiveProductsController);
/*
GET
/api/products/slug/everyday-sports-bra
*/
router.get("/slug/:slug", product_controller_1.getProductBySlugController);
/*
GET
/api/products/:id
*/
router.get("/:id", product_controller_1.getProductByIdController);
/* =========================================================
   ADMIN ROUTES
========================================================= */
/*
GET
/api/products

All products:
draft + active + inactive
*/
router.get("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, product_controller_1.getAllProductsController);
/*
POST
/api/products
*/
router.post("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, product_controller_1.createProductController);
/*
PATCH
/api/products/:id
*/
router.patch("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, product_controller_1.updateProductController);
/*
DELETE
/api/products/:id
*/
router.delete("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, product_controller_1.deleteProductController);
exports.default = router;
//# sourceMappingURL=product.routes.js.map