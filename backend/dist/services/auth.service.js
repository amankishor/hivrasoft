"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyLoginOtp = exports.sendLoginOtp = exports.verifyRegisterOtp = exports.sendRegisterOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Otp_model_1 = __importDefault(require("../models/Otp.model"));
const mail_service_1 = require("./mail.service");
const jwt_1 = require("../utils/jwt");
const OTP_EXPIRY_MINUTES = Number(process.env
    .OTP_EXPIRES_MINUTES || 5);
const OTP_RESEND_SECONDS = Number(process.env
    .OTP_RESEND_SECONDS || 60);
const MAX_OTP_ATTEMPTS = 5;
/* ========================================
   HELPERS
======================================== */
const normalizeEmail = (email) => {
    return email
        .trim()
        .toLowerCase();
};
const generateOtp = () => {
    return crypto_1.default
        .randomInt(100000, 1000000)
        .toString();
};
const hashOtp = (email, otp) => {
    const secret = process.env.OTP_HASH_SECRET;
    if (!secret) {
        throw new Error("OTP_HASH_SECRET missing in .env");
    }
    return crypto_1.default
        .createHmac("sha256", secret)
        .update(`${email}:${otp}`)
        .digest("hex");
};
const checkResendCooldown = async (email, purpose) => {
    const existing = await Otp_model_1.default.findOne({
        email,
        purpose,
    });
    if (!existing) {
        return;
    }
    const elapsed = Date.now() -
        existing.updatedAt.getTime();
    const waitMs = OTP_RESEND_SECONDS *
        1000;
    if (elapsed < waitMs) {
        const secondsLeft = Math.ceil((waitMs -
            elapsed) / 1000);
        throw new Error(`Please wait ${secondsLeft} seconds before requesting another OTP.`);
    }
};
/* ========================================
   REGISTER — SEND OTP
======================================== */
const sendRegisterOtp = async (emailInput) => {
    const email = normalizeEmail(emailInput);
    const existingUser = await User_model_1.default.findOne({
        email,
    });
    if (existingUser) {
        throw new Error("Account already exists. Please login.");
    }
    await checkResendCooldown(email, "register");
    const otp = generateOtp();
    const otpHash = hashOtp(email, otp);
    const expiresAt = new Date(Date.now() +
        OTP_EXPIRY_MINUTES *
            60 *
            1000);
    await Otp_model_1.default.findOneAndUpdate({
        email,
        purpose: "register",
    }, {
        otpHash,
        purpose: "register",
        attempts: 0,
        expiresAt,
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
    await (0, mail_service_1.sendOtpEmail)(email, otp);
    return {
        message: "OTP sent successfully",
    };
};
exports.sendRegisterOtp = sendRegisterOtp;
/* ========================================
   REGISTER — VERIFY OTP
======================================== */
const verifyRegisterOtp = async ({ name, email: emailInput, phone, otp, }) => {
    const email = normalizeEmail(emailInput);
    const existingUser = await User_model_1.default.findOne({
        email,
    });
    if (existingUser) {
        throw new Error("Account already exists.");
    }
    const otpRecord = await Otp_model_1.default.findOne({
        email,
        purpose: "register",
    });
    if (!otpRecord) {
        throw new Error("OTP expired or invalid.");
    }
    if (otpRecord
        .expiresAt
        .getTime() <
        Date.now()) {
        await Otp_model_1.default.deleteOne({
            _id: otpRecord._id,
        });
        throw new Error("OTP has expired. Please request a new OTP.");
    }
    if (otpRecord.attempts >=
        MAX_OTP_ATTEMPTS) {
        await Otp_model_1.default.deleteOne({
            _id: otpRecord._id,
        });
        throw new Error("Too many incorrect attempts. Please request a new OTP.");
    }
    const receivedHash = hashOtp(email, otp);
    if (receivedHash !==
        otpRecord.otpHash) {
        otpRecord.attempts +=
            1;
        await otpRecord.save();
        throw new Error("Incorrect OTP.");
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !==
        10) {
        throw new Error("Please enter a valid 10 digit phone number.");
    }
    const user = await User_model_1.default.create({
        name: name.trim(),
        email,
        phone: cleanPhone,
        role: "customer",
        emailVerified: true,
        isActive: true,
    });
    await Otp_model_1.default.deleteOne({
        _id: otpRecord._id,
    });
    const token = (0, jwt_1.generateToken)(String(user._id), user.role);
    return {
        user,
        token,
    };
};
exports.verifyRegisterOtp = verifyRegisterOtp;
/* ========================================
   LOGIN — SEND OTP
======================================== */
const sendLoginOtp = async (emailInput) => {
    const email = normalizeEmail(emailInput);
    const user = await User_model_1.default.findOne({
        email,
    });
    if (!user) {
        throw new Error("Account not found. Please create an account.");
    }
    if (!user.isActive) {
        throw new Error("Your account is disabled.");
    }
    await checkResendCooldown(email, "login");
    const otp = generateOtp();
    const otpHash = hashOtp(email, otp);
    const expiresAt = new Date(Date.now() +
        OTP_EXPIRY_MINUTES *
            60 *
            1000);
    await Otp_model_1.default.findOneAndUpdate({
        email,
        purpose: "login",
    }, {
        otpHash,
        purpose: "login",
        attempts: 0,
        expiresAt,
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
    await (0, mail_service_1.sendOtpEmail)(email, otp);
    return {
        message: "OTP sent successfully",
    };
};
exports.sendLoginOtp = sendLoginOtp;
/* ========================================
   LOGIN — VERIFY OTP
======================================== */
const verifyLoginOtp = async ({ email: emailInput, otp, }) => {
    const email = normalizeEmail(emailInput);
    const user = await User_model_1.default.findOne({
        email,
    });
    if (!user) {
        throw new Error("Account not found.");
    }
    if (!user.isActive) {
        throw new Error("Your account is disabled.");
    }
    const otpRecord = await Otp_model_1.default.findOne({
        email,
        purpose: "login",
    });
    if (!otpRecord) {
        throw new Error("OTP expired or invalid.");
    }
    if (otpRecord
        .expiresAt
        .getTime() <
        Date.now()) {
        await Otp_model_1.default.deleteOne({
            _id: otpRecord._id,
        });
        throw new Error("OTP has expired. Please request a new OTP.");
    }
    if (otpRecord.attempts >=
        MAX_OTP_ATTEMPTS) {
        await Otp_model_1.default.deleteOne({
            _id: otpRecord._id,
        });
        throw new Error("Too many incorrect attempts. Please request a new OTP.");
    }
    const receivedHash = hashOtp(email, otp);
    if (receivedHash !==
        otpRecord.otpHash) {
        otpRecord.attempts +=
            1;
        await otpRecord.save();
        throw new Error("Incorrect OTP.");
    }
    await Otp_model_1.default.deleteOne({
        _id: otpRecord._id,
    });
    const token = (0, jwt_1.generateToken)(String(user._id), user.role);
    return {
        user,
        token,
    };
};
exports.verifyLoginOtp = verifyLoginOtp;
//# sourceMappingURL=auth.service.js.map