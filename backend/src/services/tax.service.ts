import { Types } from "mongoose";
import TaxSetting from "../models/TaxSetting.model";

export type TaxableLine = {
  productId: string;
  amount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export async function calculateTax(input: number | TaxableLine[]) {
  const setting = await TaxSetting.findOne({}).lean();
  const percentage = setting?.isActive ? Math.max(0, Math.min(100, Number(setting.percentage || 0))) : 0;
  const applyToAllProducts = setting?.applyToAllProducts !== false;
  const excluded = new Set((applyToAllProducts ? [] : (setting?.excludedProducts || [])).map((id: any) => String(id)));

  const taxableAmount = Array.isArray(input)
    ? roundMoney(
        input.reduce((sum, line) => {
          const productId = String(line.productId || "");
          const amount = Math.max(0, Number(line.amount || 0));
          return sum + (productId && !excluded.has(productId) ? amount : 0);
        }, 0)
      )
    : roundMoney(Math.max(0, Number(input || 0)));

  const amount = percentage > 0 ? roundMoney(taxableAmount * (percentage / 100)) : 0;

  return {
    active: percentage > 0,
    name: String(setting?.name || "GST"),
    percentage,
    taxableAmount,
    amount,
    applyToAllProducts,
    excludedProducts: (applyToAllProducts ? [] : (setting?.excludedProducts || [])).map((id: any) => String(id)),
  };
}

export function normalizeExcludedProductIds(value: unknown) {
  if (!Array.isArray(value)) return [] as Types.ObjectId[];
  return Array.from(
    new Set(value.map((item) => String(item || "").trim()).filter((id) => Types.ObjectId.isValid(id)))
  ).map((id) => new Types.ObjectId(id));
}
