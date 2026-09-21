"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
/* =========================================================
   UPLOAD
========================================================= */
router.post("/image", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, upload_middleware_1.upload.single("image"), upload_controller_1.uploadImageController);
/* =========================================================
   DELETE
========================================================= */
router.delete("/image", auth_middleware_1.authenticate, admin_middleware_1.requireAdmin, upload_controller_1.deleteImageController);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map