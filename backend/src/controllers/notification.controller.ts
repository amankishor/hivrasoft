import type { Request, Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.model";
import User from "../models/User.model";
import { matchingCustomerIds } from "../services/customer-admin.service";

function currentUserId(req: Request) {
  if (!req.user?._id) throw new Error("Not authenticated.");
  return String(req.user._id);
}

function normalizeUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )
  );
}

/* =========================================================
   ADMIN - CREATE NOTIFICATION
========================================================= */

export async function createAdminNotification(req: Request, res: Response) {
  try {
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    const rawType = String(req.body?.type || "general").trim().toLowerCase();
    const rawAudience = String(req.body?.audienceType || req.body?.audience || "all").trim().toLowerCase();
    const link = String(req.body?.link || "").trim();

    if (!title) return res.status(400).json({ success: false, message: "Notification title is required." });
    if (!message) return res.status(400).json({ success: false, message: "Notification message is required." });
    if (!["general", "promotion", "order", "account", "system"].includes(rawType)) {
      return res.status(400).json({ success: false, message: "Invalid notification type." });
    }
    if (!["all", "selected", "filtered"].includes(rawAudience)) {
      return res.status(400).json({ success: false, message: "Audience must be all, selected or filtered." });
    }

    const type = rawType as "general" | "promotion" | "order" | "account" | "system";
    const audience = rawAudience as "all" | "selected" | "filtered";
    const filters = req.body?.filters && typeof req.body.filters === "object" ? req.body.filters : {};
    let userIds: string[] = [];

    if (audience === "selected") {
      userIds = normalizeUserIds(req.body?.userIds);
      if (!userIds.length) return res.status(400).json({ success: false, message: "Select at least one customer." });
      const existingUsers = await User.find({ _id: { $in: userIds }, role: "customer", isActive: true })
        .select("_id").lean();
      userIds = existingUsers.map((user: any) => String(user._id));
      if (!userIds.length) return res.status(400).json({ success: false, message: "No active selected customers found." });
    }

    if (audience === "filtered") {
      userIds = await matchingCustomerIds({ ...(filters as Record<string, unknown>), accountStatus: "active" });
      if (!userIds.length) return res.status(400).json({ success: false, message: "No active customers match these filters." });
    }

    const activeCount = audience === "all" ? await User.countDocuments({ role: "customer", isActive: true }) : userIds.length;
    const notification = await Notification.create({
      title, message, type, audience, userIds, filters: audience === "filtered" ? filters : {},
      recipientCount: activeCount, link, isActive: req.body?.isActive !== false,
      createdBy: req.user?._id || null, source: "admin", metadata: {},
    });

    return res.status(201).json({
      success: true,
      message: audience === "all" ? `Notification sent to ${activeCount} active users.` : `Notification sent to ${activeCount} user${activeCount === 1 ? "" : "s"}.`,
      matchedCount: activeCount,
      notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create notification.",
    });
  }
}

export async function previewAdminNotificationAudience(req: Request, res: Response) {
  try {
    const rawAudience = String(req.body?.audienceType || req.body?.audience || "all").toLowerCase();
    if (rawAudience === "all") {
      const count = await User.countDocuments({ role: "customer", isActive: true });
      return res.json({ success: true, count, customers: [] });
    }
    if (rawAudience === "selected") {
      const ids = normalizeUserIds(req.body?.userIds);
      const customers = await User.find({ _id: { $in: ids }, role: "customer", isActive: true })
        .select("name email phone accountStatus isActive").limit(50).lean();
      return res.json({ success: true, count: customers.length, customers });
    }
    const filters = req.body?.filters && typeof req.body.filters === "object" ? req.body.filters : {};
    const ids = await matchingCustomerIds({ ...(filters as Record<string, unknown>), accountStatus: "active" });
    const customers = ids.length
      ? await User.find({ _id: { $in: ids.slice(0, 50) } }).select("name email phone accountStatus isActive").lean()
      : [];
    return res.json({ success: true, count: ids.length, customers });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to preview audience." });
  }
}


/* =========================================================
   ADMIN - CONVENIENCE SEND ENDPOINTS
========================================================= */

export async function sendAdminNotificationToOne(req: Request, res: Response) {
  const userId = String(req.body?.userId || "").trim();
  req.body = { ...req.body, audience: "selected", userIds: userId ? [userId] : [] };
  return createAdminNotification(req, res);
}

export async function sendAdminNotificationBulk(req: Request, res: Response) {
  req.body = { ...req.body, audience: "selected", userIds: req.body?.userIds || [] };
  return createAdminNotification(req, res);
}

export async function broadcastAdminNotification(req: Request, res: Response) {
  req.body = { ...req.body, audience: "all", userIds: [], filters: {} };
  return createAdminNotification(req, res);
}

/* =========================================================
   ADMIN - LIST NOTIFICATIONS
========================================================= */

export async function listAdminNotifications(_req: Request, res: Response) {
  try {
    const notifications = await Notification.find({})
      .populate({ path: "createdBy", select: "name email role" })
      .populate({ path: "product", select: "colors isActive" })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();

    return res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load notifications.",
    });
  }
}

/* =========================================================
   ADMIN - DELETE NOTIFICATION
========================================================= */

export async function deleteAdminNotification(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const item = await Notification.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.json({ success: true, message: "Notification deleted." });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete notification.",
    });
  }
}

/* =========================================================
   USER - MY NOTIFICATIONS
========================================================= */

export async function getMyNotifications(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { audience: "all" },
        { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const items = notifications.map((notification: any) => ({
      ...notification,
      _id: String(notification._id),
      isRead: Array.isArray(notification.readBy)
        ? notification.readBy.some((id: any) => String(id) === userId)
        : false,
    }));

    const unreadCount = items.filter((item: any) => !item.isRead).length;

    return res.json({
      success: true,
      count: items.length,
      unreadCount,
      notifications: items,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load notifications.",
    });
  }
}

export async function getMyUnreadNotificationCount(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const unreadCount = await Notification.countDocuments({
      isActive: true,
      $or: [
        { audience: "all" },
        { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
      ],
      readBy: { $ne: userObjectId },
    });

    return res.json({ success: true, unreadCount });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load notification count.",
    });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const notificationId = String(req.params.id || "");

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        isActive: true,
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
      },
      { $addToSet: { readBy: userObjectId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update notification.",
    });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Notification.updateMany(
      {
        isActive: true,
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
        ],
        readBy: { $ne: userObjectId },
      },
      { $addToSet: { readBy: userObjectId } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update notifications.",
    });
  }
}
