"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorMiddleware = (error, req, res, next) => {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
    });
};
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map