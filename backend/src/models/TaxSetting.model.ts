import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITaxSetting extends Document {
  name: string;
  percentage: number;
  isActive: boolean;
  excludedProducts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const taxSettingSchema = new Schema<ITaxSetting>(
  {
    name: { type: String, trim: true, default: "GST", maxlength: 100 },
    percentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: false },
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true, versionKey: false }
);

const TaxSetting: Model<ITaxSetting> =
  (mongoose.models.TaxSetting as Model<ITaxSetting>) ||
  mongoose.model<ITaxSetting>("TaxSetting", taxSettingSchema);

export default TaxSetting;
