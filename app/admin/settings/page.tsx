"use client";

import { useEffect, useState } from "react";
import { getAdminSystemStatus } from "@/lib/admin-api";

type Status = Awaited<ReturnType<typeof getAdminSystemStatus>>;

export default function AdminSettingsPage() {
  const [data, setData] = useState<Status | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getAdminSystemStatus().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Unable to load status.")); }, []);
  return <section className="mx-auto max-w-[1000px] rounded-[22px] border border-[#211A18]/10 bg-white p-6"><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8C1839]">System API</p><h2 className="mt-2 text-2xl font-semibold">Settings & Status</h2><p className="mt-1 text-xs text-[#211A18]/50">Read-only server configuration status. Secrets are never returned.</p>{error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{!data ? <p className="py-16 text-center text-sm text-gray-500">Checking services...</p> : <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-[#FAF8F6] p-5"><h3 className="font-semibold">Services</h3><div className="mt-4 space-y-3">{Object.entries(data.services).map(([k,v]) => <Row key={k} label={k} value={v} />)}</div></div><div className="rounded-2xl bg-[#FAF8F6] p-5"><h3 className="font-semibold">Database</h3><div className="mt-4 space-y-3"><Row label="environment" value={data.environment} />{Object.entries(data.collections).map(([k,v]) => <Row key={k} label={`${k} records`} value={String(v)} />)}</div></div></div>}</section>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-[#211A18]/5 pb-3 last:border-0"><span className="text-sm capitalize text-[#211A18]/60">{label.replaceAll("_", " ")}</span><span className="text-xs font-semibold uppercase text-[#8C1839]">{value}</span></div>; }
