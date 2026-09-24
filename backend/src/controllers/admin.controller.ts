import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";

import User from "../models/User.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";
import Banner from "../models/Banner.model";
import { hashPassword, verifyPassword } from "../utils/password";

const dummyHash = hashPassword("invalid-admin-login");

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 256
  ) {
    return res.status(400).json({ message: "Enter your login ID and password." });
  }

  try {
    const user = await User.findOne({ username: username.trim() }).select("+passwordHash");
    const valid = await verifyPassword(password, user?.passwordHash || (await dummyHash));

    if (!valid || !user?.isActive || !["admin", "super_admin"].includes(user.role)) {
      return res.status(401).json({ message: "Incorrect login ID or password." });
    }

    if (!process.env.JWT_SECRET) throw new Error("JWT secret missing");

    const token = jwt.sign(
      { id: String(user._id), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch {
    return res.status(503).json({ message: "Login is unavailable. Please try again." });
  }
}

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database is not connected.");
  return db;
}

async function collectionExists(name: string) {
  const db = getDb();
  const result = await db.listCollections({ name }, { nameOnly: true }).toArray();
  return result.length > 0;
}

async function safeCollectionCount(name: string) {
  if (!(await collectionExists(name))) return 0;
  return getDb().collection(name).countDocuments({});
}

/**
 * GET /api/admin/dashboard
 * One request for all cards/status data used by the admin dashboard.
 */
export async function getAdminDashboard(_req: Request, res: Response) {
  try {
    const db = getDb();
    const hasOrders = await collectionExists("orders");

    const [products, categories, banners, customers, orders] = await Promise.all([
      Product.countDocuments({}),
      Category.countDocuments({}),
      Banner.countDocuments({}),
      User.countDocuments({ role: "customer" }),
      hasOrders ? db.collection("orders").countDocuments({}) : Promise.resolve(0),
    ]);

    let revenue = 0;
    if (hasOrders) {
      const revenueRows = await db
        .collection("orders")
        .aggregate<{ revenue: number }>([
          {
            $match: {
              status: { $nin: ["cancelled", "canceled"] },
            },
          },
          {
            $group: {
              _id: null,
              revenue: {
                $sum: {
                  $convert: {
                    input: {
                      $ifNull: [
                        "$grandTotal",
                        { $ifNull: ["$total", { $ifNull: ["$totalAmount", 0] }] },
                      ],
                    },
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ])
        .toArray();
      revenue = Number(revenueRows[0]?.revenue || 0);
    }

    return res.status(200).json({
      success: true,
      stats: { products, orders, customers, revenue, categories, banners },
      status: {
        backend: "connected",
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        productsApi: "ready",
        categoriesApi: "ready",
        bannersApi: "ready",
        cloudinary:
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
            ? "ready"
            : "pending",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load dashboard.",
    });
  }
}

/** GET /api/admin/customers */
export async function getAdminCustomers(_req: Request, res: Response) {
  try {
    const customers = await User.find({ role: "customer" })
      .select("name email phone emailVerified isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: customers.length, customers });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load customers.",
    });
  }
}

/** PATCH /api/admin/customers/:id/status */
export async function updateAdminCustomerStatus(req: Request, res: Response) {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be boolean." });
    }

    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "customer" },
      { isActive },
      { new: true }
    ).select("name email phone emailVerified isActive createdAt updatedAt");

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    return res.status(200).json({ success: true, customer });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update customer.",
    });
  }
}

/** GET /api/admin/orders - read-only admin list, works with the existing Mongo orders collection. */
export async function getAdminOrders(_req: Request, res: Response) {
  try {
    if (!(await collectionExists("orders"))) {
      return res.status(200).json({ success: true, count: 0, orders: [] });
    }

    const orders = await getDb().collection("orders").find({}).sort({ createdAt: -1 }).limit(250).toArray();
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load orders.",
    });
  }
}

/** PATCH /api/admin/orders/:id/status */
export async function updateAdminOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body || {};
    if (typeof status !== "string" || !status.trim()) {
      return res.status(400).json({ success: false, message: "Order status is required." });
    }
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id." });
    }
    if (!(await collectionExists("orders"))) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const result = await getDb().collection("orders").findOneAndUpdate(
      { _id: new Types.ObjectId(orderId) },
      { $set: { status: status.trim().toLowerCase(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const order = (result as unknown as { value?: unknown })?.value ?? result;
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update order.",
    });
  }
}

/** GET /api/admin/coupons */
export async function getAdminCoupons(_req: Request, res: Response) {
  try {
    if (!(await collectionExists("coupons"))) {
      return res.status(200).json({ success: true, count: 0, coupons: [] });
    }
    const coupons = await getDb().collection("coupons").find({}).sort({ createdAt: -1 }).limit(250).toArray();
    return res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load coupons.",
    });
  }
}

/** GET /api/admin/pages */
export async function getAdminPages(_req: Request, res: Response) {
  try {
    const name = (await collectionExists("sitepages"))
      ? "sitepages"
      : (await collectionExists("pages"))
        ? "pages"
        : null;

    if (!name) return res.status(200).json({ success: true, count: 0, pages: [] });

    const pages = await getDb().collection(name).find({}).sort({ updatedAt: -1 }).limit(250).toArray();
    return res.status(200).json({ success: true, count: pages.length, pages });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load pages.",
    });
  }
}

/** GET /api/admin/system-status */
export async function getAdminSystemStatus(_req: Request, res: Response) {
  try {
    await getDb().command({ ping: 1 });
    const [orders, coupons, pages] = await Promise.all([
      safeCollectionCount("orders"),
      safeCollectionCount("coupons"),
      collectionExists("sitepages").then((exists) =>
        exists ? safeCollectionCount("sitepages") : safeCollectionCount("pages")
      ),
    ]);

    return res.status(200).json({
      success: true,
      services: {
        backend: "connected",
        mongodb: "connected",
        cloudinary:
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
            ? "configured"
            : "not_configured",
      },
      collections: { orders, coupons, pages },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load system status.",
    });
  }
}
