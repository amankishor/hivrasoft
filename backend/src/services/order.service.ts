import { Types } from "mongoose";
import Order from "../models/Order.model";
import { clearUserCart, getUserCart } from "./cart.service";
import { trackUserActivity } from "./activity.service";

function orderNumber() {
  return `HIVRA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createOrderFromCart(userId: string, payload: any) {
  const cart: any = await getUserCart(userId);
  const availableItems = (cart.items || []).filter((item: any) => item.available && item.product?._id);
  if (!availableItems.length) throw new Error("Your cart has no available products.");
  if (!payload?.shippingAddress || typeof payload.shippingAddress !== "object") {
    throw new Error("Shipping address is required.");
  }

  const items = availableItems.map((item: any) => ({
    product: item.product._id,
    name: item.product.name,
    slug: item.product.slug,
    colorId: item.colorId,
    sizeId: item.sizeId,
    color: item.selectedColor?.name || "",
    size: item.selectedSize?.size || "",
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice || 0),
    subtotal: Number(item.subtotal || 0),
    discount: Number(item.discount?.totalDiscount || 0),
    finalTotal: Number(item.discount?.finalLineTotal ?? item.subtotal ?? 0),
  }));

  const order = await Order.create({
    orderNumber: orderNumber(),
    user: new Types.ObjectId(userId),
    items,
    subtotal: Number(cart.subtotal || 0),
    automaticDiscount: Number(cart.automaticDiscount || 0),
    codeDiscount: Number(cart.codeDiscount || 0),
    discount: Number(cart.discount || 0),
    discountCode: String(cart.appliedDiscountCode || ""),
    shipping: 0,
    tax: Number(cart.tax || 0),
    taxName: String(cart.taxSummary?.name || ""),
    taxPercentage: Number(cart.taxSummary?.percentage || 0),
    total: Number(cart.total || 0),
    paymentMethod: String(payload.paymentMethod || "cod"),
    paymentStatus: "pending",
    status: "pending",
    shippingAddress: payload.shippingAddress,
  });

  await clearUserCart(userId);

  await trackUserActivity({
    userId,
    type: "order_created",
    orderId: String(order._id),
    metadata: {
      orderNumber: order.orderNumber,
      total: Number(order.total || 0),
      itemCount: items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0),
      paymentMethod: order.paymentMethod,
    },
  });

  return order;
}

export async function getUserOrders(userId: string) {
  return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
}
