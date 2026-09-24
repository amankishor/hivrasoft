import type { Request, Response } from "express";
import mongoose from "mongoose";
import DiscountSetting from "../models/DiscountSetting.model";
import DiscountCode from "../models/DiscountCode.model";
import Product from "../models/Product.model";

const ids = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || ""))
    .filter((item) => mongoose.Types.ObjectId.isValid(item));
};

const percent = (value: unknown) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new Error("Percentage must be between 0 and 100.");
  }
  return number;
};

export async function getDiscountProducts(_req: Request, res: Response) {
  const products = await Product.find({ status: "active" })
    .select("name slug price mainImages status")
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ success: true, products });
}

export async function getAutomaticDiscount(_req: Request, res: Response) {
  const setting = await DiscountSetting.findOne({}).lean();
  return res.json({
    success: true,
    discount: setting || {
      name: "Automatic Discount",
      percentage: 0,
      isActive: false,
      excludedProducts: [],
    },
  });
}

export async function saveAutomaticDiscount(req: Request, res: Response) {
  try {
    const percentage = percent(req.body?.percentage);
    const excludedProducts = ids(req.body?.excludedProducts);
    const setting = await DiscountSetting.findOneAndUpdate(
      {},
      {
        name: String(req.body?.name || "Automatic Discount").trim().slice(0, 100),
        percentage,
        isActive: Boolean(req.body?.isActive) && percentage > 0,
        excludedProducts,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: "Automatic discount saved.", discount: setting });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to save automatic discount." });
  }
}

export async function listDiscountCodes(_req: Request, res: Response) {
  const codes = await DiscountCode.find({}).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, codes });
}

export async function createDiscountCode(req: Request, res: Response) {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Code must be 3-40 characters using letters, numbers, _ or -." });
    }
    const percentage = percent(req.body?.percentage);
    if (percentage <= 0) return res.status(400).json({ success: false, message: "Discount percentage must be greater than 0." });

    const appliesToAllProducts = Boolean(req.body?.appliesToAllProducts);
    const productIds = appliesToAllProducts ? [] : ids(req.body?.productIds);
    if (!appliesToAllProducts && productIds.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one product or choose all products." });
    }

    const created = await DiscountCode.create({
      code,
      percentage,
      isActive: req.body?.isActive !== false,
      appliesToAllProducts,
      productIds,
      startsAt: req.body?.startsAt || null,
      endsAt: req.body?.endsAt || null,
    });
    return res.status(201).json({ success: true, message: "Discount code created.", code: created });
  } catch (error: any) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "This discount code already exists." });
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create discount code." });
  }
}

export async function updateDiscountCode(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid discount code ID." });
    const update: any = {};
    if (req.body?.percentage !== undefined) update.percentage = percent(req.body.percentage);
    if (req.body?.isActive !== undefined) update.isActive = Boolean(req.body.isActive);
    if (req.body?.appliesToAllProducts !== undefined) update.appliesToAllProducts = Boolean(req.body.appliesToAllProducts);
    if (req.body?.productIds !== undefined) update.productIds = ids(req.body.productIds);
    if (req.body?.startsAt !== undefined) update.startsAt = req.body.startsAt || null;
    if (req.body?.endsAt !== undefined) update.endsAt = req.body.endsAt || null;
    if (update.appliesToAllProducts) update.productIds = [];

    const item = await DiscountCode.findByIdAndUpdate(id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Discount code not found." });
    return res.json({ success: true, message: "Discount code updated.", code: item });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update discount code." });
  }
}

export async function deleteDiscountCode(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid discount code ID." });
  const item = await DiscountCode.findByIdAndDelete(id);
  if (!item) return res.status(404).json({ success: false, message: "Discount code not found." });
  return res.json({ success: true, message: "Discount code deleted." });
}
