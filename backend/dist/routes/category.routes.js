"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = (0, express_1.Router)();
/* =========================================================
   PUBLIC CATEGORY ROUTES
========================================================= */
/* Storefront active categories */
router.get("/active", category_controller_1.getActiveCategoriesController);
/* Category tree

   /api/categories/tree
   /api/categories/tree?active=true
*/
router.get("/tree", category_controller_1.getCategoryTreeController);
/* Find category by slug */
router.get("/slug/:slug", category_controller_1.getCategoryBySlugController);
/* =========================================================
   ADMIN CATEGORY ROUTES
========================================================= */
/* All categories including disabled */
router.get("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.getAllCategoriesController);
/* Create */
router.post("/", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.createCategoryController);
/* Update */
router.patch("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.updateCategoryController);
/* Delete */
router.delete("/:id", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, category_controller_1.deleteCategoryController);
/* =========================================================
   CATEGORY BY ID
   IMPORTANT: :id route last me hi rahe
========================================================= */
router.get("/:id", category_controller_1.getCategoryByIdController);
exports.default = router;
//# sourceMappingURL=category.routes.js.map