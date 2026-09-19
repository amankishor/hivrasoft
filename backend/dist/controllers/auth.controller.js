"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.loginVerifyOtp = exports.loginSendOtp = exports.registerVerifyOtp = exports.registerSendOtp = void 0;
const auth_service_1 = require("../services/auth.service");
const ONE_YEAR_MS = 365 *
    24 *
    60 *
    60 *
    1000;
/* =========================================================
   AUTH COOKIE
========================================================= */
const setAuthCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV ===
        "production";
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction
            ? "none"
            : "lax",
        maxAge: ONE_YEAR_MS,
        path: "/",
    });
};
/* =========================================================
   REGISTER - SEND OTP
========================================================= */
const registerSendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email ||
            typeof email !==
                "string") {
            return res
                .status(400)
                .json({
                success: false,
                message: "Email is required.",
            });
        }
        const result = await (0, auth_service_1.sendRegisterOtp)(email);
        return res
            .status(200)
            .json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.registerSendOtp = registerSendOtp;
/* =========================================================
   REGISTER - VERIFY OTP
========================================================= */
const registerVerifyOtp = async (req, res) => {
    try {
        const { name, email, phone, otp, } = req.body;
        if (!name ||
            !email ||
            !phone ||
            !otp) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Name, phone, email and OTP are required.",
            });
        }
        const result = await (0, auth_service_1.verifyRegisterOtp)({
            name,
            email,
            phone,
            otp,
        });
        setAuthCookie(res, result.token);
        return res
            .status(201)
            .json({
            success: true,
            message: "Account created successfully.",
            user: {
                id: String(result.user._id),
                name: result.user.name,
                email: result.user.email,
                phone: result.user.phone,
                role: result.user.role,
            },
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.registerVerifyOtp = registerVerifyOtp;
/* =========================================================
   LOGIN - SEND OTP
========================================================= */
const loginSendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email ||
            typeof email !==
                "string") {
            return res
                .status(400)
                .json({
                success: false,
                message: "Email is required.",
            });
        }
        const result = await (0, auth_service_1.sendLoginOtp)(email);
        return res
            .status(200)
            .json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.loginSendOtp = loginSendOtp;
/* =========================================================
   LOGIN - VERIFY OTP
========================================================= */
const loginVerifyOtp = async (req, res) => {
    try {
        const { email, otp, } = req.body;
        if (!email ||
            !otp) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Email and OTP are required.",
            });
        }
        const result = await (0, auth_service_1.verifyLoginOtp)({
            email,
            otp,
        });
        setAuthCookie(res, result.token);
        return res
            .status(200)
            .json({
            success: true,
            message: "Login successful.",
            user: {
                id: String(result.user._id),
                name: result.user.name,
                email: result.user.email,
                phone: result.user.phone,
                role: result.user.role,
            },
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.loginVerifyOtp = loginVerifyOtp;
/* =========================================================
   GET CURRENT USER
========================================================= */
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Not authenticated",
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            user: {
                id: String(req.user._id),
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
            },
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to load user.",
        });
    }
};
exports.getMe = getMe;
/* =========================================================
   LOGOUT
========================================================= */
const logout = async (req, res) => {
    const isProduction = process.env.NODE_ENV ===
        "production";
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction
            ? "none"
            : "lax",
        path: "/",
    });
    return res
        .status(200)
        .json({
        success: true,
        message: "Logout successful.",
    });
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map