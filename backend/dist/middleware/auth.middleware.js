"use strict";
// middleware/auth.middleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.authenticate = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const jwt_1 = require("../utils/jwt");
/* =========================================================
   AUTHENTICATE
========================================================= */
const authenticate = async (req, res, next) => {
    try {
        /* ===============================================
           IMPORTANT:
           Login me cookie ka naam accessToken hai
        =============================================== */
        const token = req.cookies?.accessToken;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
            return;
        }
        /* ===============================================
           VERIFY TOKEN
        =============================================== */
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded?.id) {
            res.status(401).json({
                success: false,
                message: "Invalid session",
            });
            return;
        }
        /* ===============================================
           FIND USER
        =============================================== */
        const user = await User_model_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        /* ===============================================
           ACTIVE USER
        =============================================== */
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: "Account is disabled",
            });
            return;
        }
        /* ===============================================
           ATTACH USER
        =============================================== */
        req.user = user;
        next();
    }
    catch (error) {
        console.error("AUTH ERROR:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
        return;
    }
};
exports.authenticate = authenticate;
/* =========================================================
   PROTECT ALIAS

   Agar routes me protect use karna hai
========================================================= */
exports.protect = exports.authenticate;
//# sourceMappingURL=auth.middleware.js.map