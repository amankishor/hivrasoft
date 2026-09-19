"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDatabase = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI missing hai .env me");
    }
    console.log("⏳ MongoDB connect kar raha hu...");
    await mongoose_1.default.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected successfully");
};
exports.default = connectDatabase;
//# sourceMappingURL=database.js.map