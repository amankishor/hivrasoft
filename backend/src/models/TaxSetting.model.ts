import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITaxSettingHistory {
  name: string;
  percentage: number;
  isActive: boolean;
  applyToAllProducts: boolean;
  excludedProductCount: number;
  changedAt: Date;
}

export interface ITaxSetting extends Document {
  name: string;
  percentage: number;
  isActive: boolean;
  applyToAllProducts: boolean;
  excludedProducts: Types.ObjectId[];
  history: ITaxSettingHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<ITaxSettingHistory>(
  {
    name: { type: String, trim: true, default: "GST", maxlength: 100 },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: false },
    applyToAllProducts: { type: Boolean, default: true },
    excludedProductCount: { type: Number, min: 0, default: 0 },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false }
);

const taxSettingSchema = new Schema<ITaxSetting>(
  {
    name: { type: String, trim: true, default: "GST", maxlength: 100 },
    percentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: false },
    applyToAllProducts: { type: Boolean, default: true },
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

const TaxSetting: Model<ITaxSetting> =
  (mongoose.models.TaxSetting as Model<ITaxSetting>) ||
  mongoose.model<ITaxSetting>("TaxSetting", taxSettingSchema);

export default TaxSetting;
