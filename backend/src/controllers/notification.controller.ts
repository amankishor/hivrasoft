import type { Request, Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.model";
import User from "../models/User.model";

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
    const rawAudience = String(req.body?.audience || "all").trim().toLowerCase();
    const link = String(req.body?.link || "").trim();

    if (!title) {
      return res.status(400).json({ success: false, message: "Notification title is required." });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: "Notification message is required." });
    }

    if (!["general", "promotion", "order", "account", "system"].includes(rawType)) {
      return res.status(400).json({ success: false, message: "Invalid notification type." });
    }

    if (!["all", "selected"].includes(rawAudience)) {
      return res.status(400).json({ success: false, message: "Audience must be all or selected." });
    }

    const type = rawType as "general" | "promotion" | "order" | "account" | "system";
    const audience = rawAudience as "all" | "selected";

    let userIds = audience === "selected" ? normalizeUserIds(req.body?.userIds) : [];

    if (audience === "selected") {
      if (!userIds.length) {
        return res.status(400).json({ success: false, message: "Select at least one customer." });
      }

      const existingUsers = await User.find({
        _id: { $in: userIds },
        role: "customer",
        isActive: true,
      })
        .select("_id")
        .lean();

      userIds = existingUsers.map((user: any) => String(user._id));

      if (!userIds.length) {
        return res.status(400).json({ success: false, message: "No active selected customers found." });
      }
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      audience,
      userIds,
      link,
      isActive: req.body?.isActive !== false,
      createdBy: req.user?._id || null,
      source: "admin",
      metadata: {},
    });

    return res.status(201).json({
      success: true,
      message: audience === "all"
        ? "Notification sent to all users."
        : `Notification sent to ${userIds.length} selected user${userIds.length === 1 ? "" : "s"}.`,
      notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create notification.",
    });
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
  req.body = { ...req.body, audience: "all", userIds: [] };
  return createAdminNotification(req, res);
}

/* =========================================================
   ADMIN - LIST NOTIFICATIONS
========================================================= */

export async function listAdminNotifications(_req: Request, res: Response) {
  try {
    const notifications = await Notification.find({})
      .populate({ path: "userIds", select: "name email phone isActive" })
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
        { audience: "selected", userIds: userObjectId },
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
        { audience: "selected", userIds: userObjectId },
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
          { audience: "selected", userIds: userObjectId },
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
          { audience: "selected", userIds: userObjectId },
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
