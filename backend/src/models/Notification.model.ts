import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationType =
  | "general"
  | "promotion"
  | "order"
  | "account"
  | "system";

export type NotificationAudience = "all" | "selected";

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  userIds: Types.ObjectId[];
  link: string;
  isActive: boolean;
  readBy: Types.ObjectId[];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["general", "promotion", "order", "account", "system"],
      default: "general",
      index: true,
    },
    audience: {
      type: String,
      enum: ["all", "selected"],
      required: true,
      default: "all",
      index: true,
    },
    userIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    link: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ createdAt: -1, isActive: 1 });
notificationSchema.index({ audience: 1, userIds: 1, createdAt: -1 });

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
