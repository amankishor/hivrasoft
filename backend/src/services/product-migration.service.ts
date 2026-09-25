import Product from "../models/Product.model";

/**
 * Older product color subdocuments were stored without MongoDB _id values.
 * Cart and wishlist variants need a stable colorId, so persist generated IDs
 * only for documents that still have at least one color without an _id.
 */
export async function ensureProductColorIds() {
  const products = await Product.find({
    colors: { $elemMatch: { _id: { $exists: false } } },
  });

  if (!products.length) return 0;

  let updated = 0;
  for (const product of products) {
    product.markModified("colors");
    await product.save();
    updated += 1;
  }

  return updated;
}
