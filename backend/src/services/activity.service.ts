import mongoose from "mongoose";
import UserActivity, { ActivityType } from "../models/UserActivity.model";

export type TrackActivityInput = {
  userId: string;
  type: ActivityType;
  productId?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function trackUserActivity(input: TrackActivityInput) {
  try {
    if (!mongoose.Types.ObjectId.isValid(input.userId)) return null;

    const data: any = {
      user: new mongoose.Types.ObjectId(input.userId),
      type: input.type,
      metadata: input.metadata || {},
    };

    if (input.productId && mongoose.Types.ObjectId.isValid(input.productId)) {
      data.product = new mongoose.Types.ObjectId(input.productId);
    }

    if (input.orderId && mongoose.Types.ObjectId.isValid(input.orderId)) {
      data.order = new mongoose.Types.ObjectId(input.orderId);
    }

    return await UserActivity.create(data);
  } catch (error) {
    console.error("ACTIVITY TRACK ERROR:", error);
    return null;
  }
}

export async function getUserActivities(userId: string, limit = 100) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID.");
  }

  return UserActivity.find({ user: userId })
    .populate({
      path: "product",
      select: "colors isColor isActive ratings categories",
    })
    .populate({
      path: "order",
      select: "orderNumber status paymentStatus total createdAt",
    })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(250, limit)))
    .lean();
}
