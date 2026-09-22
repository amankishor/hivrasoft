"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const address_routes_1 = __importDefault(require("./routes/user/address.routes"));
const app = (0, express_1.default)();
/* =========================================================
   CORS
========================================================= */
app.use((0, cors_1.default)({
    origin: process.env
        .FRONTEND_URL ||
        "http://localhost:3000",
    credentials: true,
}));
/* =========================================================
   BODY PARSER
========================================================= */
app.use(express_1.default.json({
    limit: "10mb",
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: "10mb",
}));
/* =========================================================
   COOKIE PARSER
========================================================= */
app.use((0, cookie_parser_1.default)());
/* =========================================================
   HEALTH CHECK
========================================================= */
app.get("/api/health", (req, res) => {
    return res
        .status(200)
        .json({
        success: true,
        message: "HivraSoft backend is working",
    });
});
/* =========================================================
   AUTH
========================================================= */
app.use("/api/auth", auth_routes_1.default);
/* =========================================================
   CATEGORIES
========================================================= */
app.use("/api/categories", category_routes_1.default);
/* =========================================================
   PRODUCTS
========================================================= */
app.use("/api/products", product_routes_1.default);
app.use("/api/uploads", upload_routes_1.default);
app.use("/api/address", address_routes_1.default);
/* =========================================================
   404
========================================================= */
app.use((req, res) => {
    return res
        .status(404)
        .json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map