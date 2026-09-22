"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCloudinaryImage = exports.uploadImageBuffer = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
/* =========================================================
   UPLOAD IMAGE
========================================================= */
const uploadImageBuffer = async (buffer, folder) => {
    const cloudinary = (0, cloudinary_1.default)();
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: "image",
            unique_filename: true,
            overwrite: false,
        }, (error, result) => {
            if (error ||
                !result) {
                reject(error ||
                    new Error("Cloudinary upload failed."));
                return;
            }
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
exports.uploadImageBuffer = uploadImageBuffer;
/* =========================================================
   DELETE IMAGE
========================================================= */
const deleteCloudinaryImage = async (publicId) => {
    if (!publicId) {
        throw new Error("Cloudinary publicId is required.");
    }
    const cloudinary = (0, cloudinary_1.default)();
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
    });
};
exports.deleteCloudinaryImage = deleteCloudinaryImage;
//# sourceMappingURL=cloudinary.service.js.map