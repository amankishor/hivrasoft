import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: any[];
  subtotal: number;
  automaticDiscount: number;
  codeDiscount: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: any;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [Schema.Types.Mixed] as any, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    automaticDiscount: { type: Number, default: 0, min: 0 },
    codeDiscount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, uppercase: true, trim: true, default: "" },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], default: "pending", index: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentMethod: { type: String, trim: true, default: "cod" },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, versionKey: false }
);

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
