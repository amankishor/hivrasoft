"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/* =========================================================
   IMAGE SCHEMA
========================================================= */
const productImageSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    publicId: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    _id: false,
});
/* =========================================================
   SIZE SCHEMA
========================================================= */
const productSizeSchema = new mongoose_1.Schema({
    size: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    sku: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    _id: true,
});
/* =========================================================
   COLOR SCHEMA
========================================================= */
const productColorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    hex: {
        type: String,
        default: "",
        trim: true,
    },
    images: {
        type: [
            productImageSchema,
        ],
        default: [],
        validate: {
            validator: (value) => {
                return (value.length <= 2);
            },
            message: "Each product color can have maximum 2 images.",
        },
    },
    sizes: {
        type: [
            productSizeSchema,
        ],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
}, {
    _id: true,
});
/* =========================================================
   PRODUCT SCHEMA
========================================================= */
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    shortDescription: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    categories: [
        {
            type: mongoose_1.Schema.Types
                .ObjectId,
            ref: "Category",
        },
    ],
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    compareAtPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    costPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    mainImages: {
        type: [
            productImageSchema,
        ],
        default: [],
        validate: {
            validator: (value) => {
                return (value.length <=
                    4);
            },
            message: "Product can have maximum 4 main images.",
        },
    },
    colors: {
        type: [
            productColorSchema,
        ],
        default: [],
    },
    status: {
        type: String,
        enum: [
            "draft",
            "active",
            "inactive",
        ],
        default: "draft",
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isNewLaunch: {
        type: Boolean,
        default: false,
    },
    tags: {
        type: [
            String,
        ],
        default: [],
    },
    seoTitle: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
    },
    seoDescription: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
    },
}, {
    timestamps: true,
});
/* =========================================================
   INDEXES
========================================================= */
productSchema.index({
    categories: 1,
});
productSchema.index({
    status: 1,
});
productSchema.index({
    isFeatured: 1,
});
productSchema.index({
    isNewLaunch: 1,
});
productSchema.index({
    createdAt: -1,
});
productSchema.index({
    name: "text",
    description: "text",
    tags: "text",
});
/* =========================================================
   MODEL
========================================================= */
const Product = mongoose_1.default.models.Product ||
    mongoose_1.default.model("Product", productSchema);
exports.default = Product;
//# sourceMappingURL=Product.model.js.map