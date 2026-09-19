"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const jwt_1 = require("../utils/jwt");
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded?.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid session",
            });
        }
        const user = await User_model_1.default.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is disabled",
            });
        }
        req.user = user;
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map