import { ApiError, apiFetch } from "./api";
import type { Order, OrderItem, OrdersApiResponse } from "@/types/order";

const ORDER_ENDPOINTS = [
  "/api/orders/my-orders",
  "/api/orders",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getNestedRecord(record: Record<string, unknown>, key: string) {
  return asRecord(record[key]);
}

function normalizeOrderItem(value: unknown, index: number): OrderItem {
  const raw = asRecord(value);
  const product = getNestedRecord(raw, "product");
  const selectedColor = asRecord(raw.selectedColor || raw.color);
  const selectedSize = asRecord(raw.selectedSize || raw.size);

  const productImages = Array.isArray(product.mainImages)
    ? product.mainImages
    : Array.isArray(raw.images)
      ? raw.images
      : [];

  const firstImage = asRecord(productImages[0]);

  const quantity = Math.max(1, number(raw.quantity ?? raw.qty, 1));
  const unitPrice = number(
    raw.unitPrice ?? raw.price ?? product.price ?? raw.salePrice,
    0,
  );
  const subtotal = number(raw.subtotal ?? raw.total, unitPrice * quantity);

  return {
    id: text(raw._id ?? raw.id, `item-${index}`),
    productId: text(raw.productId ?? product._id ?? product.id) || undefined,
    name: text(raw.name ?? raw.productName ?? product.name, "Product"),
    slug: text(raw.slug ?? product.slug) || undefined,
    image:
      text(raw.image ?? raw.imageUrl ?? firstImage.url) ||
      undefined,
    color: text(raw.colorName ?? selectedColor.name ?? raw.color) || undefined,
    size: text(raw.sizeName ?? selectedSize.size ?? raw.size) || undefined,
    sku: text(raw.sku ?? selectedSize.sku) || undefined,
    quantity,
    unitPrice,
    subtotal,
  };
}

function normalizeOrder(value: unknown, index: number): Order {
  const raw = asRecord(value);
  const itemsRaw = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.orderItems)
      ? raw.orderItems
      : Array.isArray(raw.products)
        ? raw.products
        : [];

  const items = itemsRaw.map(normalizeOrderItem);
  const subtotal = number(
    raw.subtotal ?? raw.subTotal,
    items.reduce((sum, item) => sum + item.subtotal, 0),
  );
  const discount = number(raw.discount ?? raw.discountAmount, 0);
  const shipping = number(raw.shipping ?? raw.shippingFee ?? raw.shippingAmount, 0);
  const total = number(
    raw.total ?? raw.grandTotal ?? raw.totalAmount ?? raw.amount,
    subtotal - discount + shipping,
  );

  const id = text(raw._id ?? raw.id ?? raw.orderId, `order-${index}`);
  const orderNumber = text(
    raw.orderNumber ?? raw.orderNo ?? raw.number,
    id,
  );

  return {
    id,
    orderNumber,
    status: text(raw.status ?? raw.orderStatus, "processing").toLowerCase(),
    paymentStatus: text(raw.paymentStatus) || undefined,
    paymentMethod: text(raw.paymentMethod) || undefined,
    items,
    subtotal,
    discount,
    shipping,
    total,
    createdAt: text(raw.createdAt ?? raw.orderDate ?? raw.date, new Date(0).toISOString()),
    updatedAt: text(raw.updatedAt) || undefined,
    deliveredAt: text(raw.deliveredAt) || undefined,
    estimatedDelivery:
      text(raw.estimatedDelivery ?? raw.expectedDelivery ?? raw.arrivingBy) ||
      undefined,
  };
}

function extractOrders(response: OrdersApiResponse | unknown): unknown[] {
  const raw = asRecord(response);

  if (Array.isArray(raw.orders)) return raw.orders;
  if (Array.isArray(raw.data)) return raw.data;

  const data = asRecord(raw.data);
  if (Array.isArray(data.orders)) return data.orders;

  return [];
}

export async function getMyOrders(): Promise<Order[]> {
  let lastError: unknown;

  for (const endpoint of ORDER_ENDPOINTS) {
    try {
      const response = await apiFetch<OrdersApiResponse>(endpoint);
      return extractOrders(response)
        .map(normalizeOrder)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    } catch (error) {
      lastError = error;
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Order API is not available.");
}

export type CreateOrderInput = {
  addressId: string;
  paymentMethod: string;
  items: Array<{
    productId: string;
    colorId: string;
    sizeId: string;
    quantity: number;
  }>;
};

export async function createOrder(input: CreateOrderInput) {
  return apiFetch<Record<string, unknown>>("/api/orders", {
    method: "POST",
    body: {
      addressId: input.addressId,
      shippingAddressId: input.addressId,
      paymentMethod: input.paymentMethod,
      items: input.items,
    },
  });
}
