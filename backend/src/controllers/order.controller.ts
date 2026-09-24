import type { Request, Response } from "express";
import { createOrderFromCart, getUserOrders } from "../services/order.service";

function userId(req: Request) {
  if (!req.user?._id) throw new Error("Not authenticated.");
  return String(req.user._id);
}

export async function createOrderController(req: Request, res: Response) {
  try {
    const order = await createOrderFromCart(userId(req), req.body || {});
    return res.status(201).json({ success: true, message: "Order placed successfully.", order });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to place order." });
  }
}

export async function getMyOrdersController(req: Request, res: Response) {
  try {
    const orders = await getUserOrders(userId(req));
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to load orders." });
  }
}
