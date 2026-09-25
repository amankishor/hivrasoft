"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Clock3,
  Heart,
  MapPin,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type AnyRecord = Record<string, any>;

type DetailResponse = {
  success: boolean;
  customer: AnyRecord;
  account?: AnyRecord | null;
  summary: AnyRecord;
  cart: { items: AnyRecord[]; totalItems: number; subtotal: number; updatedAt?: string };
  wishlist: { items: AnyRecord[]; count: number; updatedAt?: string };
  addresses: AnyRecord[];
  activities: AnyRecord[];
  orders: AnyRecord[];
};

function money(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function dateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationFromMs(input: unknown) {
  let ms = Number(input || 0);
  if (!Number.isFinite(ms) || ms <= 0) return "Just added";
  const day = 86_400_000;
  const hour = 3_600_000;
  const minute = 60_000;
  if (ms >= day) {
    const days = Math.floor(ms / day);
    const hours = Math.floor((ms % day) / hour);
    return `${days}d${hours ? ` ${hours}h` : ""}`;
  }
  if (ms >= hour) {
    const hours = Math.floor(ms / hour);
    const minutes = Math.floor((ms % hour) / minute);
    return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
  }
  return `${Math.max(1, Math.floor(ms / minute))}m`;
}

function activityLabel(item: AnyRecord) {
  const labels: Record<string, string> = {
    register: "Account registered",
    login: "Logged in",
    logout: "Logged out",
    wishlist_add: "Added product to wishlist",
    wishlist_remove: "Removed product from wishlist",
    wishlist_clear: "Cleared wishlist",
    cart_add: "Added product to cart",
    cart_remove: "Removed product from cart",
    cart_update: "Updated cart quantity",
    cart_clear: "Cleared cart",
    checkout_started: "Started checkout",
    order_created: "Placed an order",
    order_paid: "Order payment completed",
    order_cancelled: "Order cancelled",
    order_delivered: "Order delivered",
    product_view: "Viewed product",
  };
  return labels[String(item?.type || "")] || String(item?.type || "Activity").replaceAll("_", " ");
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = String(params?.id || "");
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) return;
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/api/admin/customers/${customerId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json?.message || "Unable to load customer details.");
        if (active) setData(json);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load customer details.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [customerId]);

  const stats = useMemo(() => data?.summary || {}, [data]);

  if (loading) {
    return <div className="grid min-h-[65vh] place-items-center rounded-[28px] bg-white text-[12px] text-[#211A18]/45">Loading customer intelligence...</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-[13px] font-semibold">{error || "Customer not found."}</p>
        <Link href="/admin/customers" className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold"><ArrowLeft size={13} /> Back to customers</Link>
      </div>
    );
  }

  const customer = data.customer || {};

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <section className="overflow-hidden rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-9 md:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin/customers" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 hover:text-white"><ArrowLeft size={13} /> Customers</Link>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#F8E8ED] text-[25px] font-semibold text-[#8C1839]">
                {String(customer.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[30px] font-semibold tracking-[-0.04em]">{customer.name || "Customer"}</h1>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${customer.isActive ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>{customer.isActive ? "ACTIVE" : "DISABLED"}</span>
                </div>
                <p className="mt-2 text-[11px] text-white/50">{customer.email || "—"} · {customer.phone || "—"}</p>
              </div>
            </div>
          </div>

          <Link href={`/admin/notifications?user=${customerId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#F4DCE3] px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64142D]">
            <Bell size={15} /> Send Notification
          </Link>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<ReceiptText size={17} />} label="Orders" value={stats.totalOrders || 0} note={`${stats.deliveredOrders || 0} delivered`} />
        <Metric icon={<PackageCheck size={17} />} label="Total Spent" value={money(stats.totalOrderValue)} note={`${stats.openOrders || 0} open orders`} />
        <Metric icon={<ShoppingBag size={17} />} label="Cart" value={stats.cartQuantity || 0} note={money(stats.cartSubtotal)} />
        <Metric icon={<Heart size={17} />} label="Wishlist" value={stats.wishlistItems || 0} note="saved products" />
        <Metric icon={<Sparkles size={17} />} label="Activity" value={stats.activities || 0} note={`${stats.notifications || 0} notifications`} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Section title="Current Cart" description="Exact time each item has remained in the customer's cart." icon={<ShoppingBag size={17} />}>
          {(data.cart?.items || []).length === 0 ? <Empty text="Cart is empty." /> : (
            <div className="space-y-3">
              {data.cart.items.map((item: AnyRecord) => (
                <ProductRow key={item._id} item={item} mode="cart" />
              ))}
            </div>
          )}
        </Section>

        <Section title="Wishlist" description="See when a product was saved and how long it has stayed there." icon={<Heart size={17} />}>
          {(data.wishlist?.items || []).length === 0 ? <Empty text="Wishlist is empty." /> : (
            <div className="space-y-3">
              {data.wishlist.items.map((item: AnyRecord, index: number) => (
                <ProductRow key={`${item.product?._id || "wish"}-${index}`} item={item} mode="wishlist" />
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section className="mt-6" title="Recent Activity" description="Login, cart, wishlist and order events recorded by the backend." icon={<Clock3 size={17} />}>
        {(data.activities || []).length === 0 ? <Empty text="No tracked activity yet. New actions will appear here." /> : (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.activities.slice(0, 50).map((activity: AnyRecord) => (
              <div key={activity._id} className="flex gap-3 rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-4">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#A51D45]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#211A18]">{activityLabel(activity)}</p>
                    <span className="text-[9px] text-[#211A18]/35">{dateTime(activity.createdAt)}</span>
                  </div>
                  {(activity.product?.name || activity.order?.orderNumber) && (
                    <p className="mt-1 text-[10px] text-[#8C1839]">{activity.product?.name || `Order ${activity.order?.orderNumber}`}</p>
                  )}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#211A18]/45">
                      {Object.entries(activity.metadata).slice(0, 5).map(([key, value]) => `${key}: ${String(value)}`).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Section title="Orders" description="Full order history and current fulfillment status." icon={<ReceiptText size={17} />}>
          {(data.orders || []).length === 0 ? <Empty text="No orders yet." /> : (
            <div className="space-y-3">
              {data.orders.map((order: AnyRecord) => (
                <div key={order._id} className="rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-[#211A18]">{order.orderNumber}</p>
                      <p className="mt-1 text-[9px] text-[#211A18]/35">{dateTime(order.createdAt)} · {Array.isArray(order.items) ? order.items.length : 0} line items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-semibold text-[#211A18]">{money(order.total)}</p>
                      <p className="mt-1 text-[9px] uppercase text-[#8C1839]">{order.status} · {order.paymentStatus}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Addresses" description="Saved delivery and billing addresses." icon={<MapPin size={17} />}>
          {(data.addresses || []).length === 0 ? <Empty text="No saved addresses." /> : (
            <div className="space-y-3">
              {data.addresses.map((address: AnyRecord) => (
                <div key={address._id} className="rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-4 text-[10px] leading-5 text-[#211A18]/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#211A18]">{address.fullName || customer.name}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold uppercase text-[#8C1839]">{address.addressType || "address"}</span>
                  </div>
                  <p className="mt-2">
                    {[address.homeNumber && `Home ${address.homeNumber}`, address.officeNumber && `Office ${address.officeNumber}`, address.addressLine1, address.addressLine2, address.landmark, address.city, address.district, address.state, address.postalCode, address.country].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1">{address.phone || customer.phone}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: React.ReactNode; note: string }) {
  return (
    <div className="rounded-[20px] border border-[#211A18]/8 bg-white p-4 shadow-[0_12px_35px_rgba(33,26,24,0.04)]">
      <div className="flex items-center gap-2 text-[#8C1839]">{icon}<span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#211A18]/40">{label}</span></div>
      <p className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-[#211A18]">{value}</p>
      <p className="mt-1 text-[9px] text-[#211A18]/35">{note}</p>
    </div>
  );
}

function Section({ title, description, icon, children, className = "" }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${className} rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6`}>
      <div className="mb-5 flex items-start gap-3 border-b border-[#211A18]/8 pb-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#F8E8ED] text-[#8C1839]">{icon}</div>
        <div><h2 className="text-[17px] font-semibold text-[#211A18]">{title}</h2><p className="mt-1 text-[10px] leading-5 text-[#211A18]/40">{description}</p></div>
      </div>
      {children}
    </section>
  );
}

function ProductRow({ item, mode }: { item: AnyRecord; mode: "cart" | "wishlist" }) {
  const product = item.product || {};
  return (
    <div className="flex gap-3 rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-3">
      {product.image?.url ? <img src={product.image.url} alt={product.name || "Product"} className="h-16 w-14 shrink-0 rounded-xl object-cover" /> : <div className="grid h-16 w-14 shrink-0 place-items-center rounded-xl bg-[#EEE9E5] text-[#211A18]/30"><UserRound size={16} /></div>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#211A18]">{product.name || "Product unavailable"}</p>
            <p className="mt-1 text-[9px] text-[#211A18]/40">{[product.colorName, product.size].filter(Boolean).join(" · ") || "Product"}</p>
          </div>
          {mode === "cart" && <p className="text-[11px] font-semibold text-[#211A18]">{money(item.lineTotal)}</p>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[#211A18]/45">
          {mode === "cart" && <span>Qty {item.quantity}</span>}
          <span>Added {dateTime(item.addedAt)}</span>
          <span className="rounded-full bg-[#FFF1F5] px-2 py-1 font-semibold text-[#8C1839]">In {mode === "cart" ? "cart" : "wishlist"} for {durationFromMs(item.ageMs)}</span>
          {item.purchasedAfterAdded === true && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Purchased later</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[16px] border border-dashed border-[#211A18]/10 px-5 py-10 text-center text-[11px] text-[#211A18]/35">{text}</div>;
}
