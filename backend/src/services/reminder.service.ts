import { Types } from "mongoose";
import Cart from "../models/Cart.model";
import Wishlist from "../models/Wishlist.model";
import Product from "../models/Product.model";
import User from "../models/User.model";
import Order from "../models/Order.model";
import Notification from "../models/Notification.model";

const DAY_MS = 86_400_000;

function configuredStages(value: string | undefined, fallback: number[]) {
  const parsed = String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)
    .map((item) => Math.floor(item));

  return Array.from(new Set(parsed.length ? parsed : fallback)).sort((a, b) => b - a);
}

function ageDays(date: unknown, now: number) {
  const timestamp = date ? new Date(date as any).getTime() : NaN;
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((now - timestamp) / DAY_MS));
}

function productName(product: any) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const color = colors.find((item: any) => item?.isDefault === true) || colors[0];
  return String(color?.nameProduct || product?.name || "Your product");
}

async function activeCustomerIds(userIds: string[]) {
  if (!userIds.length) return new Set<string>();
  const users = await User.find({
    _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
    role: "customer",
    isActive: true,
  })
    .select("_id")
    .lean();
  return new Set(users.map((user: any) => String(user._id)));
}

async function upsertReminder(input: {
  dedupeKey: string;
  userId: string;
  productId: string;
  type: "cart_reminder" | "wishlist_reminder";
  title: string;
  message: string;
  link: string;
  stageDays: number;
  metadata?: Record<string, unknown>;
}) {
  const userObjectId = new Types.ObjectId(input.userId);
  const productObjectId = new Types.ObjectId(input.productId);

  const result = await Notification.updateOne(
    { dedupeKey: input.dedupeKey },
    {
      $setOnInsert: {
        title: input.title,
        message: input.message,
        type: input.type,
        audience: "selected",
        userIds: [userObjectId],
        link: input.link,
        isActive: true,
        readBy: [],
        createdBy: null,
        source: "system",
        dedupeKey: input.dedupeKey,
        product: productObjectId,
        reminderStageDays: input.stageDays,
        metadata: input.metadata || {},
      },
    },
    { upsert: true }
  );

  return result.upsertedCount > 0;
}

export async function runAbandonedCartWishlistReminders() {
  const now = Date.now();
  const cartStages = configuredStages(process.env.CART_REMINDER_DAYS, [3, 1]);
  const wishlistStages = configuredStages(process.env.WISHLIST_REMINDER_DAYS, [7]);
  const oldestNeededDays = Math.min(
    ...cartStages,
    ...wishlistStages
  );
  const cutoff = new Date(now - oldestNeededDays * DAY_MS);

  const [carts, wishlists] = await Promise.all([
    Cart.find({ "items.addedAt": { $lte: cutoff } }).lean(),
    Wishlist.find({ "items.addedAt": { $lte: cutoff } }).lean(),
  ]);

  const userIds = Array.from(
    new Set([
      ...carts.map((cart: any) => String(cart.user)),
      ...wishlists.map((wishlist: any) => String(wishlist.user)),
    ])
  ).filter((id) => Types.ObjectId.isValid(id));

  const activeUsers = await activeCustomerIds(userIds);
  const productIds = Array.from(
    new Set([
      ...carts.flatMap((cart: any) => (cart.items || []).map((item: any) => String(item.product || ""))),
      ...wishlists.flatMap((wishlist: any) => (wishlist.items || []).map((item: any) => String(item.product || ""))),
    ])
  ).filter((id) => Types.ObjectId.isValid(id));

  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select("colors isActive status").lean()
    : [];
  const productMap = new Map(products.map((product: any) => [String(product._id), product]));

  let created = 0;

  for (const cart of carts as any[]) {
    const userId = String(cart.user || "");
    if (!activeUsers.has(userId)) continue;

    for (const item of cart.items || []) {
      const productId = String(item.product || "");
      const product = productMap.get(productId) as any;
      if (!product || product.isActive === false || product.status === "inactive") continue;

      const days = ageDays(item.addedAt, now);
      const stage = cartStages.find((value) => days >= value);
      if (!stage) continue;

      const addedAt = new Date(item.addedAt).toISOString();
      const dedupeKey = [
        "cart",
        userId,
        productId,
        String(item.colorId || ""),
        String(item.sizeId || ""),
        addedAt,
        stage,
      ].join(":");
      const name = productName(product);

      if (
        await upsertReminder({
          dedupeKey,
          userId,
          productId,
          type: "cart_reminder",
          title: "Your cart is waiting for you",
          message: `${name} has been in your cart for ${days} day${days === 1 ? "" : "s"}. Complete your purchase while it is still available.`,
          link: "/account/card",
          stageDays: stage,
          metadata: {
            cartItemId: String(item._id || ""),
            colorId: String(item.colorId || ""),
            sizeId: String(item.sizeId || ""),
            addedAt,
            ageDays: days,
          },
        })
      ) {
        created += 1;
      }
    }
  }

  for (const wishlist of wishlists as any[]) {
    const userId = String(wishlist.user || "");
    if (!activeUsers.has(userId)) continue;

    for (const item of wishlist.items || []) {
      const productId = String(item.product || "");
      const product = productMap.get(productId) as any;
      if (!product || product.isActive === false || product.status === "inactive") continue;

      const days = ageDays(item.addedAt, now);
      const stage = wishlistStages.find((value) => days >= value);
      if (!stage) continue;

      const purchasedAfterSaved = await Order.exists({
        user: new Types.ObjectId(userId),
        "items.product": new Types.ObjectId(productId),
        createdAt: { $gte: new Date(item.addedAt) },
        status: { $nin: ["cancelled", "canceled"] },
      });
      if (purchasedAfterSaved) continue;

      const addedAt = new Date(item.addedAt).toISOString();
      const dedupeKey = [
        "wishlist",
        userId,
        productId,
        String(item.colorId || ""),
        String(item.sizeId || ""),
        addedAt,
        stage,
      ].join(":");
      const name = productName(product);

      if (
        await upsertReminder({
          dedupeKey,
          userId,
          productId,
          type: "wishlist_reminder",
          title: "A wishlist item is still waiting",
          message: `${name} has been in your wishlist for ${days} days. Take another look before availability changes.`,
          link: "/account/wishlist",
          stageDays: stage,
          metadata: {
            wishlistItemId: String(item._id || ""),
            colorId: String(item.colorId || ""),
            sizeId: String(item.sizeId || ""),
            addedAt,
            ageDays: days,
          },
        })
      ) {
        created += 1;
      }
    }
  }

  return { created, cartCount: carts.length, wishlistCount: wishlists.length };
}

let reminderTimer: NodeJS.Timeout | null = null;

export function startReminderScheduler() {
  if (process.env.REMINDER_SCHEDULER_ENABLED === "false" || reminderTimer) return;

  const intervalMinutes = Math.max(60, Number(process.env.REMINDER_INTERVAL_MINUTES || 60));
  const intervalMs = intervalMinutes * 60 * 1000;

  const run = async () => {
    try {
      const result = await runAbandonedCartWishlistReminders();
      if (result.created > 0) {
        console.log(`🔔 Reminder scheduler created ${result.created} notification(s).`);
      }
    } catch (error) {
      console.error("REMINDER SCHEDULER ERROR:", error);
    }
  };

  void run();
  reminderTimer = setInterval(() => void run(), intervalMs);
  reminderTimer.unref?.();
}
