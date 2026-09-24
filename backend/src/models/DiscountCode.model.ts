import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   DISCOUNT CODE
========================================================= */

export interface IDiscountCode extends Document {
  code: string;
  percentage: number;
  isActive: boolean;
  appliesToAllProducts: boolean;
  productIds: Types.ObjectId[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const discountCodeSchema = new Schema<IDiscountCode>(
  {
    code: {
      type: String,
      required: [true, "Discount code is required."],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
      match: [
        /^[A-Z0-9_-]+$/,
        "Code can use only letters, numbers, _ or -.",
      ],
      index: true,
    },

    percentage: {
      type: Number,
      required: [true, "Discount percentage is required."],
      min: [0.01, "Discount percentage must be greater than 0."],
      max: [100, "Discount percentage cannot be greater than 100."],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    appliesToAllProducts: {
      type: Boolean,
      default: true,
    },

    productIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
    },

    startsAt: {
      type: Date,
      default: null,
    },

    endsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

discountCodeSchema.index({ isActive: 1, createdAt: -1 });
discountCodeSchema.index({ productIds: 1 });

const DiscountCode: Model<IDiscountCode> =
  (mongoose.models.DiscountCode as Model<IDiscountCode>) ||
  mongoose.model<IDiscountCode>("DiscountCode", discountCodeSchema);

export default DiscountCode;
