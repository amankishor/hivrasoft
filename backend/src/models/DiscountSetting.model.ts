import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDiscountSettingHistory {
  name: string;
  percentage: number;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  excludedProductCount: number;
  changedAt: Date;
}

export interface IDiscountSetting extends Document {
  name: string;
  percentage: number;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  excludedProducts: Types.ObjectId[];
  history: IDiscountSettingHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<IDiscountSettingHistory>(
  {
    name: { type: String, trim: true, default: "Automatic Discount", maxlength: 100 },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: false },
    minAmount: { type: Number, min: 0, default: 0 },
    maxAmount: { type: Number, min: 0, default: null },
    excludedProductCount: { type: Number, min: 0, default: 0 },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false }
);

const discountSettingSchema = new Schema<IDiscountSetting>(
  {
    name: { type: String, trim: true, default: "Automatic Discount", maxlength: 100 },
    percentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: false },
    minAmount: { type: Number, min: 0, default: 0 },
    maxAmount: { type: Number, min: 0, default: null },
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

const DiscountSetting: Model<IDiscountSetting> =
  (mongoose.models.DiscountSetting as Model<IDiscountSetting>) ||
  mongoose.model<IDiscountSetting>("DiscountSetting", discountSettingSchema);

export default DiscountSetting;
