import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDiscountSetting extends Document {
  name: string;
  percentage: number;
  isActive: boolean;
  excludedProducts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const discountSettingSchema = new Schema<IDiscountSetting>(
  {
    name: { type: String, trim: true, default: "Automatic Discount", maxlength: 100 },
    percentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: false },
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true, versionKey: false }
);

const DiscountSetting: Model<IDiscountSetting> =
  (mongoose.models.DiscountSetting as Model<IDiscountSetting>) ||
  mongoose.model<IDiscountSetting>("DiscountSetting", discountSettingSchema);

export default DiscountSetting;
