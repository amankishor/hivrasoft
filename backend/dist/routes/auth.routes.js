"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* =========================================================
   OTP RATE LIMITER
========================================================= */
const otpSendLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after some time.",
    },
});
/* =========================================================
   REGISTER
========================================================= */
router.post("/register/send-otp", otpSendLimiter, auth_controller_1.registerSendOtp);
router.post("/register/verify-otp", auth_controller_1.registerVerifyOtp);
/* =========================================================
   LOGIN
========================================================= */
router.post("/login/send-otp", otpSendLimiter, auth_controller_1.loginSendOtp);
router.post("/login/verify-otp", auth_controller_1.loginVerifyOtp);
/* =========================================================
   CURRENT USER
========================================================= */
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.getMe);
/* =========================================================
   LOGOUT
========================================================= */
router.post("/logout", auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map