import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";

import User from "../models/User.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";
import Banner from "../models/Banner.model";
import Order from "../models/Order.model";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import Address from "../models/user/address.model";
import Account from "../models/user/account.model";
import { hashPassword, verifyPassword } from "../utils/password";
import { getUserActivities, trackUserActivity } from "../services/activity.service";
import Notification from "../models/Notification.model";

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

/** GET /api/admin/customers/:id - complete customer 360 view for admin. */
export async function getAdminCustomerDetails(req: Request, res: Response) {
  try {
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id." });
    }

    const userObjectId = new Types.ObjectId(customerId);

    const customer = await User.findOne({ _id: userObjectId, role: "customer" })
      .select("name username email phone role emailVerified isActive avatar createdAt updatedAt")
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const [account, addresses, orders, cart, wishlist, activities, notificationCount] = await Promise.all([
      Account.findOne({ user: userObjectId })
        .select("role emailVerified phoneVerified isActive isBlocked createdAt updatedAt")
        .lean(),
      Address.find({ user: userObjectId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Order.find({ user: userObjectId }).sort({ createdAt: -1 }).lean(),
      Cart.findOne({ user: userObjectId }).lean(),
      Wishlist.findOne({ user: userObjectId }).lean(),
      getUserActivities(customerId, 100),
      Notification.countDocuments({
        isActive: true,
        $or: [
          { audience: "all" },
          { audience: "selected", userIds: userObjectId },
        ],
      }),
    ]);

    const productIds = Array.from(
      new Set([
        ...((cart?.items || []).map((item: any) => String(item.product || ""))),
        ...((wishlist?.items || []).map((item: any) => String(item.product || ""))),
      ].filter((id) => Types.ObjectId.isValid(id)))
    );

    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) } })
          .populate({ path: "categories", select: "name slug" })
          .lean()
      : [];

    const productMap = new Map(products.map((product: any) => [String(product._id), product]));

    const pickColor = (product: any, colorId?: unknown) => {
      const colors = Array.isArray(product?.colors) ? product.colors : [];
      if (!colors.length) return null;

      const requested = String(colorId || "");
      const byId = requested
        ? colors.find((color: any) => String(color?._id || "") === requested)
        : null;

      return byId || colors.find((color: any) => color?.isDefault === true) || colors[0] || null;
    };

    const pickSize = (color: any, sizeId?: unknown) => {
      const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
      const requested = String(sizeId || "");
      return (
        (requested ? sizes.find((size: any) => String(size?._id || "") === requested) : null) ||
        sizes.find((size: any) => size?.isActive !== false) ||
        sizes[0] ||
        null
      );
    };

    const productView = (product: any, colorId?: unknown, sizeId?: unknown) => {
      if (!product) return null;

      const color = pickColor(product, colorId);
      const size = pickSize(color, sizeId);
      const images = Array.isArray(color?.images) ? color.images : [];
      const mainImages = Array.isArray(product?.mainImages) ? product.mainImages : [];
      const image =
        images.find((item: any) => item?.isDefault === true) ||
        images[0] ||
        mainImages.find((item: any) => item?.isDefault === true) ||
        mainImages[0] ||
        null;
      const categoryList = Array.isArray(product?.categories) ? product.categories : [];
      const colorStock = (Array.isArray(color?.sizes) ? color.sizes : []).reduce(
        (sum: number, item: any) => sum + Math.max(0, Number(item?.stock || 0)),
        0
      );
      const stock = color ? colorStock : Math.max(0, Number(product?.stock || 0));

      return {
        _id: String(product._id),
        name: String(color?.nameProduct || product?.name || "Product"),
        slug: String(color?.slugProduct || product?.slug || ""),
        colorName: String(color?.nameColor || ""),
        colorHex: String(color?.hex || ""),
        size: String(size?.size || ""),
        originalPrice: Number(
          size?.originalPrice ?? color?.originalPrice ?? product?.compareAtPrice ?? product?.price ?? 0
        ),
        showPrice: Number(size?.showPrice ?? color?.showPrice ?? product?.price ?? 0),
        stock,
        image: image?.url ? { url: String(image.url), publicId: String(image.publicId || "") } : null,
        categories: categoryList.map((category: any) => ({
          _id: String(category?._id || category || ""),
          name: String(category?.name || ""),
          slug: String(category?.slug || ""),
        })),
        isActive: product?.isActive !== false,
      };
    };

    const cartItems = (cart?.items || []).map((item: any) => {
      const product = productMap.get(String(item.product || ""));
      const view = productView(product, item.colorId, item.sizeId);
      const quantity = Math.max(0, Number(item.quantity || 0));
      const unitPrice = Number(view?.showPrice || 0);
      return {
        _id: String(item._id || ""),
        product: view,
        quantity,
        unitPrice,
        lineTotal: Number((unitPrice * quantity).toFixed(2)),
        addedAt: item.addedAt || null,
        ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
      };
    });

    const wishlistItems = (wishlist?.items || []).map((item: any) => {
      const product = productMap.get(String(item.product || ""));
      return {
        product: productView(product),
        addedAt: item.addedAt || null,
        ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
      };
    });

    const normalizedOrders = orders.map((order: any) => ({
      _id: String(order._id),
      orderNumber: String(order.orderNumber || order._id),
      status: String(order.status || "pending").toLowerCase(),
      paymentStatus: String(order.paymentStatus || "pending").toLowerCase(),
      paymentMethod: String(order.paymentMethod || ""),
      subtotal: Number(order.subtotal || 0),
      automaticDiscount: Number(order.automaticDiscount || 0),
      codeDiscount: Number(order.codeDiscount || 0),
      discount: Number(order.discount || 0),
      discountCode: String(order.discountCode || ""),
      shipping: Number(order.shipping || 0),
      total: Number(order.total ?? order.grandTotal ?? order.totalAmount ?? 0),
      items: Array.isArray(order.items) ? order.items : [],
      shippingAddress: order.shippingAddress || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    const deliveredOrders = normalizedOrders.filter((order) => order.status === "delivered");
    const cancelledOrders = normalizedOrders.filter((order) => ["cancelled", "canceled"].includes(order.status));
    const openOrders = normalizedOrders.filter(
      (order) => order.status !== "delivered" && !["cancelled", "canceled"].includes(order.status)
    );
    const paidOrders = normalizedOrders.filter((order) => order.paymentStatus === "paid");

    const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalOrderValue = normalizedOrders
      .filter((order) => !["cancelled", "canceled"].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    const deliveredValue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalDiscount = normalizedOrders.reduce((sum, order) => sum + order.discount, 0);

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        _id: String(customer._id),
      },
      account: account
        ? {
            ...account,
            _id: String((account as any)._id),
          }
        : null,
      summary: {
        totalOrders: normalizedOrders.length,
        deliveredOrders: deliveredOrders.length,
        openOrders: openOrders.length,
        cancelledOrders: cancelledOrders.length,
        paidOrders: paidOrders.length,
        totalOrderValue: Number(totalOrderValue.toFixed(2)),
        deliveredValue: Number(deliveredValue.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        averageOrderValue:
          normalizedOrders.length > 0
            ? Number((totalOrderValue / normalizedOrders.length).toFixed(2))
            : 0,
        cartQuantity,
        cartSubtotal: Number(cartSubtotal.toFixed(2)),
        wishlistItems: wishlistItems.length,
        addresses: addresses.length,
        lastOrderAt: normalizedOrders[0]?.createdAt || null,
        notifications: notificationCount,
        activities: activities.length,
        lastActivityAt: activities[0]?.createdAt || null,
      },
      cart: {
        _id: cart?._id ? String(cart._id) : null,
        discountCode: String(cart?.discountCode || ""),
        items: cartItems,
        totalItems: cartQuantity,
        subtotal: Number(cartSubtotal.toFixed(2)),
        updatedAt: cart?.updatedAt || null,
      },
      wishlist: {
        _id: wishlist?._id ? String(wishlist._id) : null,
        items: wishlistItems,
        count: wishlistItems.length,
        updatedAt: wishlist?.updatedAt || null,
      },
      addresses: addresses.map((address: any) => ({
        ...address,
        _id: String(address._id),
        user: String(address.user || customerId),
      })),
      activities: activities.map((activity: any) => ({
        ...activity,
        _id: String(activity._id),
        user: String(activity.user || customerId),
        product: activity.product
          ? {
              _id: String(activity.product._id),
              name: String(
                activity.product?.colors?.find((color: any) => color?.isDefault)?.nameProduct ||
                activity.product?.colors?.[0]?.nameProduct ||
                "Product"
              ),
            }
          : null,
        order: activity.order
          ? {
              _id: String(activity.order._id),
              orderNumber: String(activity.order.orderNumber || activity.order._id),
              status: String(activity.order.status || ""),
              total: Number(activity.order.total || 0),
            }
          : null,
      })),
      orders: normalizedOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load customer details.",
    });
  }
}

/** GET /api/admin/customers/:id/activity */
export async function getAdminCustomerActivity(req: Request, res: Response) {
  try {
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id." });
    }

    const customer = await User.findOne({ _id: customerId, role: "customer" })
      .select("_id name email phone")
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const limit = Math.min(250, Math.max(1, Number(req.query.limit || 100)));
    const activities = await getUserActivities(customerId, limit);

    return res.json({
      success: true,
      customer,
      count: activities.length,
      activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load customer activity.",
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

    const order: any = (result as unknown as { value?: unknown })?.value ?? result;
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const normalizedStatus = status.trim().toLowerCase();
    if (order.user && ["delivered", "cancelled", "canceled"].includes(normalizedStatus)) {
      await trackUserActivity({
        userId: String(order.user),
        type: normalizedStatus === "delivered" ? "order_delivered" : "order_cancelled",
        orderId: String(order._id),
        metadata: {
          orderNumber: String(order.orderNumber || order._id),
          status: normalizedStatus,
          total: Number(order.total || 0),
        },
      });
    }

    if (order.user && ["confirmed", "processing", "shipped", "delivered", "cancelled", "canceled"].includes(normalizedStatus)) {
      const orderNumber = String(order.orderNumber || order._id);
      const statusTitle: Record<string, string> = {
        confirmed: "Order Confirmed",
        processing: "Order Processing",
        shipped: "Order Shipped",
        delivered: "Order Delivered",
        cancelled: "Order Cancelled",
        canceled: "Order Cancelled",
      };

      await Notification.create({
        title: statusTitle[normalizedStatus] || "Order Update",
        message: `Your order ${orderNumber} is now ${normalizedStatus === "canceled" ? "cancelled" : normalizedStatus}.`,
        type: "order",
        audience: "selected",
        userIds: [order.user],
        link: "/account/orders",
        isActive: true,
        createdBy: req.user?._id || null,
      });
    }

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
