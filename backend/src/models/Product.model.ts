import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* =========================================================
   PRODUCT IMAGE TYPE
========================================================= */

export interface IProductImage {
  url: string;
  publicId: string;
  isDefault: boolean;
}

/* =========================================================
   PRODUCT SIZE TYPE
========================================================= */

export interface IProductSize {
  _id?: Types.ObjectId;
  size: string;
  stock: number;
  originalPrice: number;
  showPrice: number;
  discountPrice: number;
  isActive: boolean;
}

/* =========================================================
   PRODUCT COLOR TYPE
========================================================= */

export interface IProductColor {
  _id?: Types.ObjectId;

  nameProduct: string;
  slugProduct: string;

  nameColor: string;
  slugColor: string;

  hex?: string;
  isDefault: boolean;

  originalPrice: number;
  showPrice: number;
  discountPrice: number;

  shortDescription?: string;
  description?: string;

  tags: string[];

  seoTitle?: string;
  seoDescription?: string;

  images: IProductImage[];
  sizes: IProductSize[];
}

/* =========================================================
   PRODUCT RATING TYPE
========================================================= */

export interface IProductRating {
  average: number;
  count: number;
}

/* =========================================================
   PRODUCT TYPE
========================================================= */

export interface IProduct extends Document {
  ratings: IProductRating;
  categories: Types.ObjectId[];
  isColor: boolean;
  colors: IProductColor[];
  isActive: boolean;
  isFeatured: boolean;
  isNewLaunch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   PRODUCT IMAGE SCHEMA
========================================================= */

const productImageSchema = new Schema<IProductImage>(
  {
    url: {
      type: String,
      required: [true, "Product image URL is required."],
      trim: true,
    },

    publicId: {
      type: String,
      required: [true, "Product image publicId is required."],
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   PRODUCT SIZE SCHEMA
========================================================= */

const productSizeSchema = new Schema<IProductSize>(
  {
    size: {
      type: String,
      required: [true, "Product size is required."],
      trim: true,
      uppercase: true,
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required."],
      default: 0,
      min: [0, "Stock cannot be negative."],
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Stock must be a whole number.",
      },
    },

    originalPrice: {
      type: Number,
      required: [true, "Original price is required."],
      default: 0,
      min: [0, "Original price cannot be negative."],
    },

    showPrice: {
      type: Number,
      required: [true, "Show price is required."],
      default: 0,
      min: [0, "Show price cannot be negative."],
    },

    discountPrice: {
      type: Number,
      required: [true, "Discount price is required."],
      default: 0,
      min: [0, "Discount price cannot be negative."],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

/* =========================================================
   PRODUCT COLOR SCHEMA

   IMPORTANT:
   _id MUST be true because cart API requires colorId.
========================================================= */

const productColorSchema = new Schema<IProductColor>(
  {
    nameProduct: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters."],
    },

    slugProduct: {
      type: String,
      required: [true, "Product slug is required."],
      trim: true,
      lowercase: true,
      maxlength: [250, "Product slug cannot exceed 250 characters."],
    },

    nameColor: {
      type: String,
      required: [true, "Color name is required."],
      trim: true,
    },

    slugColor: {
      type: String,
      required: [true, "Color slug is required."],
      trim: true,
      lowercase: true,
    },

    hex: {
      type: String,
      default: "",
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    originalPrice: {
      type: Number,
      required: [true, "Original price is required."],
      default: 0,
      min: [0, "Original price cannot be negative."],
    },

    showPrice: {
      type: Number,
      required: [true, "Show price is required."],
      default: 0,
      min: [0, "Show price cannot be negative."],
    },

    discountPrice: {
      type: Number,
      required: [true, "Discount price is required."],
      default: 0,
      min: [0, "Discount price cannot be negative."],
    },

    shortDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Short description cannot exceed 1000 characters."],
    },

    description: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    seoTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "SEO title cannot exceed 200 characters."],
    },

    seoDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "SEO description cannot exceed 1000 characters."],
    },

    images: {
      type: [productImageSchema],
      default: [],
    },

    sizes: {
      type: [productSizeSchema],
      default: [],
    },
  },
  {
    _id: true,
  }
);

/* =========================================================
   PRODUCT RATING SCHEMA
========================================================= */

const productRatingSchema = new Schema<IProductRating>(
  {
    average: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0."],
      max: [5, "Rating cannot be greater than 5."],
    },

    count: {
      type: Number,
      default: 0,
      min: [0, "Rating count cannot be negative."],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   MAIN PRODUCT SCHEMA
========================================================= */

const productSchema = new Schema<IProduct>(
  {
    ratings: {
      type: productRatingSchema,
      default: () => ({
        average: 0,
        count: 0,
      }),
    },

    categories: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      required: [true, "Product category is required."],
      default: [],
      validate: {
        validator: (categories: Types.ObjectId[]) =>
          Array.isArray(categories) && categories.length > 0,
        message: "At least one category is required.",
      },
    },

    isColor: {
      type: Boolean,
      required: true,
      default: true,
    },

    colors: {
      type: [productColorSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isNewLaunch: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   VALIDATION + LEGACY VARIANT ID MIGRATION
========================================================= */

productSchema.pre("validate", function () {
  /* Existing old products may have colors without _id because
     old schema used _id:false. Generate one before save. */
  for (const color of this.colors || []) {
    if (!color._id) {
      color._id = new Types.ObjectId();
    }

    for (const size of color.sizes || []) {
      if (!size._id) {
        size._id = new Types.ObjectId();
      }
    }
  }

  if (this.isColor && this.colors.length === 0) {
    this.invalidate(
      "colors",
      "At least one color is required when isColor is true."
    );
  }

  if (!this.isColor && this.colors.length > 0) {
    this.invalidate(
      "colors",
      "Colors are not allowed when isColor is false."
    );
  }

  if (this.isColor && this.colors.length > 0) {
    const defaultColors = this.colors.filter(
      (color) => color.isDefault === true
    );

    if (defaultColors.length > 1) {
      this.invalidate("colors", "Only one color can be default.");
    }
  }

  const productSlugs = this.colors.map((color) => color.slugProduct);
  const uniqueProductSlugs = new Set(productSlugs);

  if (productSlugs.length !== uniqueProductSlugs.size) {
    this.invalidate("colors", "Duplicate product slug is not allowed.");
  }

  const colorSlugs = this.colors.map((color) => color.slugColor);
  const uniqueColorSlugs = new Set(colorSlugs);

  if (colorSlugs.length !== uniqueColorSlugs.size) {
    this.invalidate("colors", "Duplicate color is not allowed.");
  }

  for (const color of this.colors) {
    const defaultImages = color.images.filter(
      (image) => image.isDefault === true
    );

    if (defaultImages.length > 1) {
      this.invalidate(
        "colors",
        `Only one default image is allowed for ${color.nameProduct}.`
      );
    }
  }
});

/* =========================================================
   INDEXES
========================================================= */

productSchema.index({ categories: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewLaunch: 1 });
productSchema.index({ "ratings.average": -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ "colors.slugProduct": 1 });
productSchema.index({ "colors.slugColor": 1 });

productSchema.index({
  "colors.nameProduct": "text",
  "colors.shortDescription": "text",
  "colors.description": "text",
  "colors.tags": "text",
});

/* =========================================================
   MODEL
========================================================= */

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
