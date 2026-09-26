import type { Request, Response } from "express";
import TaxSetting from "../models/TaxSetting.model";
import Product from "../models/Product.model";
import { normalizeExcludedProductIds } from "../services/tax.service";

function normalizePercentage(value: unknown) {
  const percentage = Number(value);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("Tax percentage must be between 0 and 100.");
  }
  return percentage;
}

export async function getTaxSettingAdmin(_req: Request, res: Response) {
  try {
    const setting = await TaxSetting.findOne({}).lean();
    return res.json({
      success: true,
      tax: setting || {
        name: "GST",
        percentage: 0,
        isActive: false,
        applyToAllProducts: true,
        excludedProducts: [],
        history: [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load tax setting.",
    });
  }
}

export async function saveTaxSettingAdmin(req: Request, res: Response) {
  try {
    const percentage = normalizePercentage(req.body?.percentage);
    const name = String(req.body?.name || "GST").trim().slice(0, 100) || "GST";
    const isActive = Boolean(req.body?.isActive) && percentage > 0;
    const applyToAllProducts = req.body?.applyToAllProducts !== false;
    let excludedProducts = applyToAllProducts ? [] : normalizeExcludedProductIds(req.body?.excludedProducts);

    if (excludedProducts.length) {
      const existing = await Product.find({ _id: { $in: excludedProducts } }).select("_id").lean();
      const allowed = new Set(existing.map((item: any) => String(item._id)));
      excludedProducts = excludedProducts.filter((id) => allowed.has(String(id)));
    }

    let tax = await TaxSetting.findOne({});
    if (!tax) {
      tax = new TaxSetting({ name, percentage, isActive, applyToAllProducts, excludedProducts });
    } else {
      tax.name = name;
      tax.percentage = percentage;
      tax.isActive = isActive;
      tax.applyToAllProducts = applyToAllProducts;
      tax.excludedProducts = excludedProducts;
    }

    tax.history.push({
      name,
      percentage,
      isActive,
      applyToAllProducts,
      excludedProductCount: excludedProducts.length,
      changedAt: new Date(),
    } as any);
    if (tax.history.length > 50) tax.history.splice(0, tax.history.length - 50);
    await tax.save();

    return res.json({ success: true, message: "Tax setting saved.", tax });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to save tax setting.",
    });
  }
}
