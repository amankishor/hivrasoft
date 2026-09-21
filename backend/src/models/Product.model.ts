import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export type ProductStatus =
  | "draft"
  | "active"
  | "inactive";

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProductSize {
  size: string;
  sku: string;
  stock: number;
  isActive: boolean;
}

export interface IProductColor {
  name: string;
  slug: string;
  hex?: string;

  images: IProductImage[];

  sizes: IProductSize[];

  isActive: boolean;

  sortOrder: number;
}

export interface IProductRating {
  average: number;
  count: number;
}

export interface IProduct extends Document {
  name: string;

  slug: string;

  shortDescription?: string;

  description?: string;

  categories: Types.ObjectId[];

  price: number;

  compareAtPrice?: number;

  costPrice?: number;

  /*
    Product-level stock.
    This is a single overall stock value entered by admin.
    Existing color/size stock fields remain unchanged.
  */
  stock: number;

  mainImages: IProductImage[];

  colors: IProductColor[];

  ratings: IProductRating;

  status: ProductStatus;

  isFeatured: boolean;

  isNewLaunch: boolean;

  tags: string[];

  seoTitle?: string;

  seoDescription?: string;

  createdAt: Date;

  updatedAt: Date;
}

/* =========================================================
   IMAGE SCHEMA
========================================================= */

const productImageSchema =
  new Schema<IProductImage>(
    {
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
    },
    {
      _id: false,
    }
  );

/* =========================================================
   SIZE SCHEMA
========================================================= */

const productSizeSchema =
  new Schema<IProductSize>(
    {
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
    },
    {
      _id: true,
    }
  );

/* =========================================================
   COLOR SCHEMA
========================================================= */

const productColorSchema =
  new Schema<IProductColor>(
    {
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

      /*
        Unlimited color images at application level.
        Admin can upload as many images as needed.
      */
      images: {
        type: [
          productImageSchema,
        ],

        default: [],
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
    },
    {
      _id: true,
    }
  );

/* =========================================================
   RATING SCHEMA

   Review documents ko Product ke andar store mat karo.
   Sirf summary rakho:
   average = 0..5
   count   = total reviews
========================================================= */

const productRatingSchema =
  new Schema<IProductRating>(
    {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   PRODUCT SCHEMA
========================================================= */

const productSchema =
  new Schema<IProduct>(
    {
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
        maxlength: 250,
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

      categories: {
        type: [
          {
            type:
              Schema.Types.ObjectId,

            ref:
              "Category",
          },
        ],

        default: [],

        validate: {
          validator:
            (
              value: Types.ObjectId[]
            ) =>
              value.length > 0,

          message:
            "At least one category is required.",
        },
      },

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

      /*
        Single product-level stock entered from Add/Edit Product.
        Existing variant size stock remains available separately.
      */
      stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
          validator: (value: number) =>
            Number.isInteger(value),

          message:
            "Product stock must be a whole number.",
        },
      },

      /*
        Unlimited main gallery images at application level.
        mainImages[0] is the main / primary product image.
      */
      mainImages: {
        type: [
          productImageSchema,
        ],

        default: [],
      },

      colors: {
        type: [
          productColorSchema,
        ],

        default: [],
      },

      ratings: {
        type:
          productRatingSchema,

        default: () => ({
          average: 0,
          count: 0,
        }),
      },

      status: {
        type: String,

        enum: [
          "draft",
          "active",
          "inactive",
        ],

        default:
          "draft",
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
    },
    {
      timestamps: true,
    }
  );

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
  "ratings.average": -1,
});

productSchema.index({
  createdAt: -1,
});

productSchema.index({
  "colors.sizes.sku": 1,
});

productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

/* =========================================================
   MODEL
========================================================= */

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>(
    "Product",
    productSchema
  );

export default Product;
