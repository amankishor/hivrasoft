import { Types } from "mongoose";
import DiscountSetting from "../models/DiscountSetting.model";
import DiscountCode from "../models/DiscountCode.model";

export type DiscountableLine = {
  productId: string;
  unitPrice: number;
  quantity: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export async function calculateDiscounts(lines: DiscountableLine[], code?: string | null) {
  const now = new Date();
  const auto = await DiscountSetting.findOne({}).lean();
  const normalizedCode = String(code || "").trim().toUpperCase();
  const coupon = normalizedCode
    ? await DiscountCode.findOne({ code: normalizedCode, isActive: true }).lean()
    : null;

  const excluded = new Set((auto?.excludedProducts || []).map((id: any) => String(id)));
  const couponProducts = new Set((coupon?.productIds || []).map((id: any) => String(id)));
  const autoPercent = auto?.isActive ? Number(auto.percentage || 0) : 0;
  const couponValidDate = Boolean(
    coupon &&
      (!coupon.startsAt || new Date(coupon.startsAt) <= now) &&
      (!coupon.endsAt || new Date(coupon.endsAt) >= now)
  );
  const couponPercent = couponValidDate ? Number(coupon?.percentage || 0) : 0;

  let automaticDiscount = 0;
  let codeDiscount = 0;

  const itemDiscounts = lines.map((line) => {
    const base = Number(line.unitPrice || 0) * Number(line.quantity || 0);
    const automaticEligible = autoPercent > 0 && !excluded.has(line.productId);
    const autoAmount = automaticEligible ? roundMoney(base * (autoPercent / 100)) : 0;
    const afterAuto = Math.max(0, base - autoAmount);

    const codeEligible = Boolean(
      couponPercent > 0 &&
        coupon &&
        (coupon.appliesToAllProducts || couponProducts.has(line.productId))
    );
    const codeAmount = codeEligible ? roundMoney(afterAuto * (couponPercent / 100)) : 0;

    automaticDiscount += autoAmount;
    codeDiscount += codeAmount;

    return {
      productId: line.productId,
      automaticPercentage: automaticEligible ? autoPercent : 0,
      automaticDiscount: autoAmount,
      codePercentage: codeEligible ? couponPercent : 0,
      codeDiscount: codeAmount,
      totalDiscount: roundMoney(autoAmount + codeAmount),
      finalLineTotal: roundMoney(base - autoAmount - codeAmount),
    };
  });

  automaticDiscount = roundMoney(automaticDiscount);
  codeDiscount = roundMoney(codeDiscount);

  return {
    automatic: {
      active: autoPercent > 0,
      name: auto?.name || "Automatic Discount",
      percentage: autoPercent,
      amount: automaticDiscount,
    },
    code: normalizedCode
      ? {
          code: normalizedCode,
          valid: Boolean(coupon && couponValidDate),
          percentage: couponPercent,
          amount: codeDiscount,
          message: !coupon
            ? "Discount code not found."
            : !couponValidDate
              ? "Discount code is not active for this date."
              : codeDiscount <= 0
                ? "This code is not valid for products in your cart."
                : "Discount code applied.",
        }
      : null,
    itemDiscounts,
    automaticDiscount,
    codeDiscount,
    totalDiscount: roundMoney(automaticDiscount + codeDiscount),
  };
}
