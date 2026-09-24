"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, UserRound, Users } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/customers`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Unable to load customers.");
        if (active) setCustomers(Array.isArray(data?.customers) ? data.customers : []);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [customers, search]);

  const activeCount = customers.filter((customer) => customer.isActive).length;

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="overflow-hidden rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-9 md:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Customer Intelligence</p>
            <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.04em]">Customers</h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/60">
              Open any customer to see cart age, wishlist age, orders, addresses and complete activity timeline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total" value={customers.length} />
            <Stat label="Active" value={activeCount} />
          </div>
        </div>
      </section>

      {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</div>}

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F8E8ED] text-[#8C1839]"><Users size={19} /></div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#211A18]">All users</h2>
              <p className="mt-1 text-[10px] text-[#211A18]/40">Click View to open complete customer detail.</p>
            </div>
          </div>

          <div className="flex h-12 min-w-[280px] items-center gap-3 rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
            <Search size={16} className="text-[#211A18]/35" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#211A18]/30" />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#211A18]/35">
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[12px] text-[#211A18]/40">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[12px] text-[#211A18]/40">No customer found.</td></tr>
              ) : filtered.map((customer) => (
                <tr key={customer._id} className="bg-[#FAF8F6] text-[11px] text-[#211A18]">
                  <td className="rounded-l-[14px] px-4 py-3.5">
                    <Link href={`/admin/customers/${customer._id}`} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F8E8ED] font-semibold text-[#8C1839]">
                        {customer.name?.trim()?.charAt(0)?.toUpperCase() || <UserRound size={16} />}
                      </span>
                      <span>
                        <span className="block font-semibold">{customer.name || "Customer"}</span>
                        <span className="mt-0.5 block text-[9px] text-[#211A18]/35">Click to view full activity</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-[#211A18]/60">{customer.phone || "—"}</td>
                  <td className="px-4 py-3.5 text-[#211A18]/60">{customer.email || "—"}</td>
                  <td className="px-4 py-3.5 text-[#211A18]/50">{new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${customer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {customer.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="rounded-r-[14px] px-4 py-3.5 text-right">
                    <Link href={`/admin/customers/${customer._id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#211A18] px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#8C1839]">
                      View <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[110px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
      <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className="mt-1 text-[24px] font-semibold">{value}</p>
    </div>
  );
}
