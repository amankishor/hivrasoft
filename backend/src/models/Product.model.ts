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
  name?: string;
  alt?: string;
  isDefault: boolean;
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

  nameProduct: string;
  slugProduct: string;

  nameColor: string;
  slugColor: string;

  hex?: string;
  isDefault: boolean;

  shortDescription?: string;
  description?: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;

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
  stock: number;

  mainImages: IProductImage[];

  isColor: boolean;
  colors: IProductColor[];

  ratings: IProductRating;

  status: ProductStatus;
  isActive: boolean;
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

      name: {
        type: String,
        default: "",
        trim: true,
      },

      alt: {
        type: String,
        default: "",
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
      /* Legacy aliases used by cart/admin code. */
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

      /* Public color-product API fields. */
      nameProduct: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      slugProduct: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 250,
      },

      nameColor: {
        type: String,
        required: true,
        trim: true,
      },

      slugColor: {
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

      isDefault: {
        type: Boolean,
        default: false,
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

      tags: {
        type: [String],
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

      images: {
        type: [productImageSchema],
        default: [],
      },

      sizes: {
        type: [productSizeSchema],
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
      /*
        Base product fields are retained for admin/cart compatibility.
        The clean /api/products/catalog response intentionally exposes
        the color-centric shape requested by the storefront.
      */
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
            type: Schema.Types.ObjectId,
            ref: "Category",
          },
        ],
        default: [],
        validate: {
          validator: (
            value: Types.ObjectId[]
          ) => value.length > 0,
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

      stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
          validator: (
            value: number
          ) => Number.isInteger(value),
          message:
            "Product stock must be a whole number.",
        },
      },

      /* Used only when isColor=false. */
      mainImages: {
        type: [productImageSchema],
        default: [],
      },

      isColor: {
        type: Boolean,
        required: true,
        default: false,
      },

      colors: {
        type: [productColorSchema],
        default: [],
      },

      ratings: {
        type: productRatingSchema,
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
        default: "draft",
      },

      isActive: {
        type: Boolean,
        default: false,
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
        type: [String],
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
   COLOR MODE INVARIANT

   isColor=true  -> at least one color is required.
   isColor=false -> colors must be empty.

   Service layer also enforces this so API clients receive a
   clear 400 message before Mongoose validation.
========================================================= */

productSchema.pre(
  "validate",
  function () {
    if (
      this.isColor &&
      this.colors.length === 0
    ) {
      this.invalidate(
        "colors",
        "At least one color variant is required when isColor is true."
      );
    }

    if (
      !this.isColor &&
      this.colors.length > 0
    ) {
      this.invalidate(
        "colors",
        "Colors are not allowed when isColor is false."
      );
    }
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
  isActive: 1,
});

productSchema.index({
  isColor: 1,
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
  "colors.slugProduct": 1,
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
