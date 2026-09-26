"use client";

import { useEffect, useState } from "react";
import DiscountProductSelector from "@/src/components/Admin/DiscountProductSelector";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

type DiscountHistoryItem = {
  _id?: string;
  name?: string;
  percentage: number;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  excludedProductCount?: number;
  changedAt?: string;
};

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function dateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AutomaticDiscountPage() {
  const [percentage, setPercentage] = useState("5");
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("");
  const [history, setHistory] = useState<DiscountHistoryItem[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [applyToAllProducts, setApplyToAllProducts] = useState(true);
  const [excludedProducts, setExcludedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/admin/discounts/automatic`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load automatic discount."
          );
        }

        if (cancelled) return;

        const excluded = Array.isArray(
          data?.discount?.excludedProducts
        )
          ? data.discount.excludedProducts.map(
              (item: unknown) => String(item)
            )
          : [];

        setPercentage(
          String(data?.discount?.percentage ?? 0)
        );
        setMinAmount(String(data?.discount?.minAmount ?? 0));
        setMaxAmount(
          data?.discount?.maxAmount === null || data?.discount?.maxAmount === undefined
            ? ""
            : String(data.discount.maxAmount)
        );
        setHistory(Array.isArray(data?.discount?.history) ? data.discount.history : []);
        setIsActive(
          data?.discount?.isActive === true
        );
        setExcludedProducts(excluded);
        setApplyToAllProducts(
          excluded.length === 0
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load automatic discount."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const number = Number(percentage);

      if (
        !Number.isFinite(number) ||
        number < 0 ||
        number > 100
      ) {
        throw new Error(
          "Discount percentage must be between 0 and 100."
        );
      }

      const min = Number(minAmount);
      const max = maxAmount.trim() === "" ? null : Number(maxAmount);
      if (!Number.isFinite(min) || min < 0) {
        throw new Error("Minimum base price must be 0 or greater.");
      }
      if (max !== null && (!Number.isFinite(max) || max < min)) {
        throw new Error("Maximum base price must be greater than or equal to minimum base price.");
      }

      const response = await fetch(
        `${API_URL}/api/admin/discounts/automatic`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Automatic Discount",
            percentage: number,
            minAmount: min,
            maxAmount: max,
            isActive,
            applyToAllProducts,
            excludedProducts: applyToAllProducts
              ? []
              : excludedProducts,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save automatic discount."
        );
      }

      setSuccess(
        data?.message ||
          "Automatic discount saved."
      );
      if (Array.isArray(data?.discount?.history)) {
        setHistory(data.discount.history);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save automatic discount."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-8 md:py-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">
          Extra Add
        </p>
        <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em]">
          Automatic Discount
        </h2>
        <p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/65">
          Set one percentage for the store. Keep All Products on to apply it everywhere, or turn it off and choose products that should not receive the automatic discount.
        </p>
      </section>

      {(error || success) && (
        <div
          className={`mt-5 rounded-[16px] border px-4 py-3 text-[12px] ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <label className="block">
            <span className="text-[12px] font-semibold text-[#211A18]">
              Discount percentage
            </span>
            <div className="mt-3 flex h-14 items-center rounded-[15px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={percentage}
                disabled={loading}
                onChange={(event) =>
                  setPercentage(
                    event.target.value
                  )
                }
                className="min-w-0 flex-1 bg-transparent text-[16px] text-[#211A18] outline-none"
              />
              <span className="text-[14px] font-semibold text-[#211A18]">
                %
              </span>
            </div>
          </label>



          <div className="mt-5">
            <p className="text-[12px] font-semibold text-[#211A18]">Base price range</p>
            <p className="mt-1 text-[10px] leading-4 text-[#211A18]/45">
              Automatic discount applies only when the cart subtotal is inside this range.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-medium text-[#211A18]/55">Minimum</span>
                <div className="mt-2 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                  <span className="mr-2 text-[12px] font-semibold text-[#211A18]/45">₹</span>
                  <input type="number" min={0} step="0.01" value={minAmount} disabled={loading} onChange={(event) => setMinAmount(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] text-[#211A18] outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-[10px] font-medium text-[#211A18]/55">Maximum</span>
                <div className="mt-2 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                  <span className="mr-2 text-[12px] font-semibold text-[#211A18]/45">₹</span>
                  <input type="number" min={0} step="0.01" value={maxAmount} disabled={loading} onChange={(event) => setMaxAmount(event.target.value)} placeholder="No limit" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#211A18] outline-none" />
                </div>
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <ToggleRow
              label="Active"
              description="Apply the automatic discount when it is configured."
              checked={isActive}
              onChange={setIsActive}
              disabled={loading}
            />

            <ToggleRow
              label="All Products"
              description="ON = every active product receives this automatic discount."
              checked={applyToAllProducts}
              onChange={(value) => {
                setApplyToAllProducts(value);
                if (value) {
                  setExcludedProducts([]);
                }
              }}
              disabled={loading}
            />
          </div>

          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="mt-5 h-14 w-full rounded-[14px] bg-[#A51D45] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#8C1839] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Discount"}
          </button>

          <div className="mt-4 rounded-[14px] bg-[#F8F5F2] px-4 py-3 text-[10px] leading-5 text-[#211A18]/50">
            {applyToAllProducts
              ? "All Products is ON. No product is excluded."
              : `${excludedProducts.length} product${excludedProducts.length === 1 ? "" : "s"} excluded from the automatic discount.`}
          </div>
        </section>

        <DiscountProductSelector
          selectedIds={excludedProducts}
          onChange={setExcludedProducts}
          disabled={applyToAllProducts}
          title="Products without automatic discount"
          description="Use the category dropdown or search. When All Products is OFF, checked products are excluded from the automatic discount."
          emptySelectionText="No products are excluded."
        />
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#211A18]/8 pb-5">
          <div>
            <h3 className="text-[18px] font-semibold text-[#211A18]">Automatic Discount History</h3>
            <p className="mt-1 text-[11px] text-[#211A18]/40">Saved percentage, price range and active/inactive changes.</p>
          </div>
          <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">{history.length} entries</span>
        </div>
        {history.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#211A18]/40">No history yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[11px]">
              <thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40">
                <tr><th className="px-3 py-3">Saved</th><th className="px-3 py-3">Discount</th><th className="px-3 py-3">Base Price Range</th><th className="px-3 py-3">Excluded</th><th className="px-3 py-3">Status</th></tr>
              </thead>
              <tbody>
                {[...history].reverse().map((item, index) => (
                  <tr key={item._id || `${item.changedAt}-${index}`} className="border-t border-[#211A18]/6 text-[#211A18]/65">
                    <td className="px-3 py-3">{dateTime(item.changedAt)}</td>
                    <td className="px-3 py-3 font-semibold text-[#211A18]">{item.percentage}%</td>
                    <td className="px-3 py-3">{money(item.minAmount)} – {item.maxAmount === null ? "No limit" : money(item.maxAmount)}</td>
                    <td className="px-3 py-3">{Number(item.excludedProductCount || 0)}</td>
                    <td className="px-3 py-3">{item.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[16px] bg-[#FAF8F6] px-4 py-4">
      <span>
        <span className="block text-[12px] font-semibold text-[#211A18]">
          {label}
        </span>
        <span className="mt-1 block text-[10px] leading-4 text-[#211A18]/45">
          {description}
        </span>
      </span>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#A51D45]"
            : "bg-[#211A18]/12"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.checked)
          }
          className="sr-only"
        />
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </label>
  );
}
