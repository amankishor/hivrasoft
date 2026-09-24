"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Search, Send, Trash2, Users } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
};

type AdminNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  audience: "all" | "selected";
  userIds?: Customer[];
  link?: string;
  isActive: boolean;
  readBy?: string[];
  createdAt: string;
};

async function readJson(response: Response) {
  try { return await response.json(); } catch { return {}; }
}

export default function AdminNotificationsPage() {
  const [presetUserId, setPresetUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [link, setLink] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [customersResponse, notificationsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/customers`, { credentials: "include", cache: "no-store" }),
        fetch(`${API_URL}/api/admin/notifications`, { credentials: "include", cache: "no-store" }),
      ]);

      const [customerData, notificationData] = await Promise.all([
        readJson(customersResponse),
        readJson(notificationsResponse),
      ]);

      if (!customersResponse.ok) throw new Error(customerData?.message || "Unable to load customers.");
      if (!notificationsResponse.ok) throw new Error(notificationData?.message || "Unable to load notifications.");

      const nextCustomers = Array.isArray(customerData?.customers) ? customerData.customers : [];
      setCustomers(nextCustomers);
      setNotifications(Array.isArray(notificationData?.notifications) ? notificationData.notifications : []);

      if (presetUserId && nextCustomers.some((customer: Customer) => customer._id === presetUserId)) {
        setAudience("selected");
        setSelectedIds([presetUserId]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notification center.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("user") || "";
    setPresetUserId(value);
  }, []);

  useEffect(() => { void load(); }, [presetUserId]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((customer) => {
      if (!customer.isActive) return false;
      if (!q) return true;
      return [customer.name, customer.email, customer.phone].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [customers, search]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleUser(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function sendNotification() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!title.trim()) throw new Error("Notification title is required.");
      if (!message.trim()) throw new Error("Notification message is required.");
      if (audience === "selected" && selectedIds.length === 0) throw new Error("Select at least one customer.");

      const response = await fetch(`${API_URL}/api/admin/notifications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          audience,
          userIds: audience === "selected" ? selectedIds : [],
          link: link.trim(),
          isActive: true,
        }),
      });

      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to send notification.");

      setSuccess(data?.message || "Notification sent.");
      setTitle("");
      setMessage("");
      setLink("");
      setType("general");
      setAudience("all");
      setSelectedIds([]);
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send notification.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotification(id: string) {
    if (!window.confirm("Delete this notification?")) return;
    try {
      setBusyId(id);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete notification.");
      setNotifications((current) => current.filter((item) => item._id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete notification.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="overflow-hidden rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-9 md:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Customer Communication</p>
            <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.04em]">Notifications</h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/60">
              Send offers, account messages and order updates to all users or exact selected customers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HeroStat label="Sent" value={notifications.length} />
            <HeroStat label="Customers" value={customers.length} />
          </div>
        </div>
      </section>

      {(error || success) && (
        <div className={`mt-5 rounded-2xl border px-4 py-3 text-[12px] ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || success}
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[500px_1fr]">
        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3 border-b border-[#211A18]/8 pb-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F8E8ED] text-[#8C1839]"><Send size={18} /></div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#211A18]">Create Notification</h2>
              <p className="mt-1 text-[10px] text-[#211A18]/40">Notification appears in the customer website bell.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Title">
              <input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Weekend Sale" className={inputClass} />
            </Field>

            <Field label="Message">
              <textarea value={message} maxLength={2000} onChange={(event) => setMessage(event.target.value)} placeholder="Get 20% discount on selected products today." className={`${inputClass} min-h-28 resize-y py-3`} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <select value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
                  <option value="general">General</option>
                  <option value="promotion">Promotion</option>
                  <option value="order">Order</option>
                  <option value="account">Account</option>
                  <option value="system">System</option>
                </select>
              </Field>

              <Field label="Link">
                <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="/sale" className={inputClass} />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold text-[#211A18]">Send To</p>
              <div className="grid grid-cols-2 gap-2">
                <AudienceButton active={audience === "all"} label="All Users" onClick={() => { setAudience("all"); setSelectedIds([]); }} />
                <AudienceButton active={audience === "selected"} label="Selected Users" onClick={() => setAudience("selected")} />
              </div>
            </div>

            <button type="button" onClick={() => void sendNotification()} disabled={saving} className="h-14 w-full rounded-[14px] bg-[#A51D45] text-[11px] font-semibold uppercase tracking-[0.09em] text-white transition hover:bg-[#8C1839] disabled:opacity-50">
              {saving ? "Sending..." : audience === "all" ? "Send To All Users" : `Send To ${selectedIds.length} Selected`}
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#211A18]/8 pb-5">
            <div>
              <h2 className="text-[17px] font-semibold text-[#211A18]">Target Users</h2>
              <p className="mt-1 text-[10px] leading-5 text-[#211A18]/40">
                {audience === "all" ? "All active customers will receive this message." : "Search and select exact customers."}
              </p>
            </div>
            <span className="rounded-full bg-[#FFF2F6] px-3 py-1.5 text-[10px] font-semibold text-[#8C1839]">{audience === "all" ? `${customers.filter((item) => item.isActive).length} users` : `${selectedIds.length} selected`}</span>
          </div>

          {audience === "all" ? (
            <div className="mt-5 grid min-h-[360px] place-items-center rounded-[20px] border border-dashed border-[#8C1839]/20 bg-[#FFF9FB] p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F8E8ED] text-[#8C1839]"><Users size={25} /></div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#211A18]">All Users</h3>
                <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[#211A18]/45">This notification will be visible to every active customer after login.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 flex h-12 items-center gap-3 rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                <Search size={16} className="text-[#211A18]/35" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#211A18]/30" />
              </div>

              <div className="mt-4 max-h-[390px] space-y-2 overflow-y-auto pr-1">
                {filteredCustomers.map((customer) => {
                  const checked = selectedSet.has(customer._id);
                  return (
                    <button key={customer._id} type="button" onClick={() => toggleUser(customer._id)} className={`flex w-full items-center gap-3 rounded-[15px] border p-3 text-left transition ${checked ? "border-[#8C1839]/25 bg-[#FFF6F8]" : "border-[#211A18]/8 hover:bg-[#FAF8F6]"}`}>
                      <span className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? "border-[#8C1839] bg-[#8C1839] text-white" : "border-[#211A18]/15 text-transparent"}`}><Check size={12} /></span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F2EEEA] text-[11px] font-semibold text-[#211A18]/60">{customer.name?.charAt(0)?.toUpperCase() || "U"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-[#211A18]">{customer.name}</span>
                        <span className="mt-0.5 block truncate text-[9px] text-[#211A18]/40">{customer.email} · {customer.phone}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between border-b border-[#211A18]/8 pb-5">
          <div>
            <h2 className="text-[17px] font-semibold text-[#211A18]">Sent Notifications</h2>
            <p className="mt-1 text-[10px] text-[#211A18]/40">History of admin messages.</p>
          </div>
          <Bell size={18} className="text-[#8C1839]" />
        </div>

        {loading ? (
          <div className="py-12 text-center text-[12px] text-[#211A18]/40">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-[12px] text-[#211A18]/40">No notification sent yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {notifications.map((item) => (
              <div key={item._id} className="flex flex-col gap-4 rounded-[18px] border border-[#211A18]/8 bg-[#FAF8F6] p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[12px] font-semibold text-[#211A18]">{item.title}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold uppercase text-[#8C1839]">{item.type}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-[#211A18]/50">{item.audience === "all" ? "All Users" : `${item.userIds?.length || 0} selected`}</span>
                  </div>
                  <p className="mt-1.5 max-w-3xl text-[10px] leading-4 text-[#211A18]/55">{item.message}</p>
                  <p className="mt-2 text-[9px] text-[#211A18]/30">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <button type="button" disabled={busyId === item._id} onClick={() => void deleteNotification(item._id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-[9px] font-semibold text-red-600 disabled:opacity-40">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return <div className="min-w-[110px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"><p className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</p><p className="mt-1 text-[24px] font-semibold">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-semibold text-[#211A18]">{label}</span>{children}</label>;
}

function AudienceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`h-12 rounded-[14px] border text-[11px] font-semibold transition ${active ? "border-[#8C1839]/25 bg-[#FFF3F7] text-[#8C1839]" : "border-[#211A18]/10 bg-white text-[#211A18]/60"}`}>{label}</button>;
}

const inputClass = "min-h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] text-[#211A18] outline-none transition placeholder:text-[#211A18]/30 focus:border-[#8C1839]/30 focus:ring-4 focus:ring-[#8C1839]/5";
