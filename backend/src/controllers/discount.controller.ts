import type { Request, Response } from "express";
import mongoose from "mongoose";
import DiscountSetting from "../models/DiscountSetting.model";
import DiscountCode from "../models/DiscountCode.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";

const ids = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((item) => mongoose.Types.ObjectId.isValid(item))
    )
  );
};

const percent = (value: unknown) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new Error("Percentage must be between 0 and 100.");
  }

  return number;
};

const productStock = (product: any) =>
  (Array.isArray(product?.colors) ? product.colors : []).reduce(
    (total: number, color: any) =>
      total +
      (Array.isArray(color?.sizes) ? color.sizes : []).reduce(
        (sum: number, size: any) =>
          sum + Math.max(0, Number(size?.stock || 0)),
        0
      ),
    0
  );

const defaultProductColor = (product: any) => {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  return colors.find((color: any) => color?.isDefault) || colors[0] || null;
};

const defaultProductImage = (color: any) => {
  const images = Array.isArray(color?.images) ? color.images : [];
  return images.find((image: any) => image?.isDefault) || images[0] || null;
};

/* =========================================================
   PRODUCTS + CATEGORIES FOR ADMIN DISCOUNT PICKERS
========================================================= */

export async function getDiscountProducts(_req: Request, res: Response) {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true })
        .select("categories isColor colors isActive createdAt")
        .populate({
          path: "categories",
          select: "name slug level parent ancestors isActive sortOrder",
        })
        .sort({ createdAt: -1 })
        .lean(),

      Category.find({ isActive: true })
        .select("name slug level parent ancestors sortOrder")
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .lean(),
    ]);

    const formattedProducts = products.map((product: any) => {
      const color = defaultProductColor(product);
      const image = defaultProductImage(color);
      const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
      const firstActiveSize = sizes.find((size: any) => size?.isActive !== false) || sizes[0];

      return {
        _id: String(product._id),
        name: String(color?.nameProduct || "Unnamed product"),
        slug: String(color?.slugProduct || ""),
        colorName: String(color?.nameColor || ""),
        isColor: product?.isColor !== false,
        originalPrice: Number(
          color?.originalPrice ?? firstActiveSize?.originalPrice ?? 0
        ),
        showPrice: Number(color?.showPrice ?? firstActiveSize?.showPrice ?? 0),
        stock: productStock(product),
        image: image
          ? {
              url: String(image.url || ""),
              publicId: String(image.publicId || ""),
            }
          : null,
        categories: (Array.isArray(product?.categories) ? product.categories : [])
          .filter(Boolean)
          .map((category: any) => ({
            _id: String(category._id),
            name: String(category.name || "Category"),
            slug: String(category.slug || ""),
            level: Number(category.level || 0),
          })),
      };
    });

    return res.json({
      success: true,
      products: formattedProducts,
      categories: categories.map((category: any) => ({
        _id: String(category._id),
        name: String(category.name || "Category"),
        slug: String(category.slug || ""),
        level: Number(category.level || 0),
        parent: category.parent ? String(category.parent) : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load products for discounts.",
    });
  }
}

/* =========================================================
   AUTOMATIC DISCOUNT
========================================================= */

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
    const excludedProducts = req.body?.applyToAllProducts === true
      ? []
      : ids(req.body?.excludedProducts);

    const setting = await DiscountSetting.findOneAndUpdate(
      {},
      {
        name: String(req.body?.name || "Automatic Discount")
          .trim()
          .slice(0, 100),
        percentage,
        isActive: Boolean(req.body?.isActive) && percentage > 0,
        excludedProducts,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: "Automatic discount saved.",
      discount: setting,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save automatic discount.",
    });
  }
}

/* =========================================================
   DISCOUNT CODES
========================================================= */

export async function listDiscountCodes(_req: Request, res: Response) {
  const codes = await DiscountCode.find({})
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, codes });
}

export async function createDiscountCode(req: Request, res: Response) {
  try {
    const code = String(req.body?.code || "")
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message:
          "Code must be 3-40 characters using letters, numbers, _ or -.",
      });
    }

    const percentage = percent(req.body?.percentage);

    if (percentage <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount percentage must be greater than 0.",
      });
    }

    const appliesToAllProducts = Boolean(req.body?.appliesToAllProducts);
    const productIds = appliesToAllProducts ? [] : ids(req.body?.productIds);

    if (!appliesToAllProducts && productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product or choose all products.",
      });
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

    return res.status(201).json({
      success: true,
      message: "Discount code created.",
      code: created,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This discount code already exists.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create discount code.",
    });
  }
}

export async function updateDiscountCode(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount code ID.",
      });
    }

    const update: any = {};

    if (req.body?.percentage !== undefined) {
      update.percentage = percent(req.body.percentage);
    }

    if (req.body?.isActive !== undefined) {
      update.isActive = Boolean(req.body.isActive);
    }

    if (req.body?.appliesToAllProducts !== undefined) {
      update.appliesToAllProducts = Boolean(req.body.appliesToAllProducts);
    }

    if (req.body?.productIds !== undefined) {
      update.productIds = ids(req.body.productIds);
    }

    if (req.body?.startsAt !== undefined) {
      update.startsAt = req.body.startsAt || null;
    }

    if (req.body?.endsAt !== undefined) {
      update.endsAt = req.body.endsAt || null;
    }

    if (update.appliesToAllProducts) {
      update.productIds = [];
    }

    const item = await DiscountCode.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found.",
      });
    }

    return res.json({
      success: true,
      message: "Discount code updated.",
      code: item,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update discount code.",
    });
  }
}

export async function deleteDiscountCode(req: Request, res: Response) {
  const id = String(req.params.id || "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid discount code ID.",
    });
  }

  const item = await DiscountCode.findByIdAndDelete(id);

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Discount code not found.",
    });
  }

  return res.json({
    success: true,
    message: "Discount code deleted.",
  });
}
