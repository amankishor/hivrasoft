import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   CATEGORY IMAGE
========================================================= */

export interface ICategoryImage {
  url: string;
  publicId: string;
}

/* =========================================================
   CATEGORY
========================================================= */

export interface ICategory extends Document {
  name: string;

  slug: string;

  description?: string;

  parent: Types.ObjectId | null;

  ancestors: Types.ObjectId[];

  level: number;

  image?: ICategoryImage;

  isActive: boolean;

  sortOrder: number;

  createdAt: Date;

  updatedAt: Date;
}

/* =========================================================
   IMAGE SCHEMA
========================================================= */

const categoryImageSchema =
  new Schema<ICategoryImage>(
    {
      url: {
        type: String,
        default: "",
        trim: true,
      },

      publicId: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   CATEGORY SCHEMA
========================================================= */

const categorySchema =
  new Schema<ICategory>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      parent: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null,
      },

      ancestors: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],

      level: {
        type: Number,
        default: 0,
        min: 0,
      },

      image: {
        type: categoryImageSchema,
        default: () => ({
          url: "",
          publicId: "",
        }),
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
      timestamps: true,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

categorySchema.index({
  parent: 1,
  sortOrder: 1,
});

categorySchema.index({
  ancestors: 1,
});

categorySchema.index({
  isActive: 1,
});

/* =========================================================
   MODEL
========================================================= */

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>(
    "Category",
    categorySchema
  );

export default Category;