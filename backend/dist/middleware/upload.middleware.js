"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
];
const fileFilter = (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(new Error("Only JPG, PNG, WEBP and AVIF images are allowed."));
        return;
    }
    callback(null, true);
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 *
            1024 *
            1024,
    },
});
//# sourceMappingURL=upload.middleware.js.map