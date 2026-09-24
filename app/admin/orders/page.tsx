"use client";

import { useEffect, useState } from "react";
import { getAdminOrders, setAdminOrderStatus } from "@/lib/admin-api";

function text(v: unknown, fallback = "—") { return typeof v === "string" || typeof v === "number" ? String(v) : fallback; }
function money(v: unknown) { const n = Number(v || 0); return `₹${Number.isFinite(n) ? n.toLocaleString("en-IN") : "0"}`; }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getAdminOrders().then(setOrders).catch((err) => setError(err instanceof Error ? err.message : "Unable to load orders.")).finally(() => setLoading(false));
  }, []);

  async function updateStatus(order: Record<string, unknown>, status: string) {
    const id = text(order._id, "");
    if (!id) return;
    try {
      setBusyId(id);
      const result = await setAdminOrderStatus(id, status);
      setOrders((items) => items.map((item) => text(item._id, "") === id ? result.order : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally { setBusyId(null); }
  }

  return (
    <section className="mx-auto max-w-[1500px] rounded-[22px] border border-[#211A18]/10 bg-white p-6">
      <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8C1839]">Orders API</p><h2 className="mt-2 text-2xl font-semibold">Orders</h2><p className="mt-1 text-xs text-[#211A18]/50">Orders are read directly from the MongoDB orders collection.</p></div>
      {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <p className="py-16 text-center text-sm text-gray-500">Loading orders...</p> : (
        <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b text-[10px] uppercase tracking-wider text-gray-500"><th className="py-3">Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
          {orders.map((order) => {
            const id = text(order._id, "");
            const user = order.user && typeof order.user === "object" ? order.user as Record<string, unknown> : {};
            const shipping = order.shippingAddress && typeof order.shippingAddress === "object" ? order.shippingAddress as Record<string, unknown> : {};
            const status = text(order.status ?? order.orderStatus, "processing").toLowerCase();
            const total = order.grandTotal ?? order.total ?? order.totalAmount;
            return <tr key={id} className="border-b border-[#211A18]/5"><td className="py-4 font-medium">{text(order.orderNumber ?? order.orderNo ?? order.number, id.slice(-8) || "—")}</td><td>{text(user.name ?? order.customerName ?? shipping.name ?? shipping.fullName)}</td><td>{order.createdAt ? new Date(String(order.createdAt)).toLocaleString("en-IN") : "—"}</td><td>{money(total)}</td><td>{text(order.paymentStatus ?? order.paymentMethod)}</td><td><select disabled={busyId === id} value={status} onChange={(e) => updateStatus(order, e.target.value)} className="rounded-lg border px-3 py-2 text-xs"><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td></tr>;
          })}
        </tbody></table>{!orders.length && <p className="py-12 text-center text-sm text-gray-500">No orders in database yet.</p>}</div>
      )}
    </section>
  );
}
