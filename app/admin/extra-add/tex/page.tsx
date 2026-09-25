"use client";

import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import DiscountProductSelector from "@/src/components/Admin/DiscountProductSelector";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function TaxSettingsPage() {
  const [name, setName] = useState("GST");
  const [percentage, setPercentage] = useState("0");
  const [isActive, setIsActive] = useState(false);
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

        const response = await fetch(`${API_URL}/api/admin/tax`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load tax settings.");
        }
        if (cancelled) return;

        const excluded = Array.isArray(data?.tax?.excludedProducts)
          ? data.tax.excludedProducts.map((item: unknown) => String(item))
          : [];

        setName(String(data?.tax?.name || "GST"));
        setPercentage(String(data?.tax?.percentage ?? 0));
        setIsActive(data?.tax?.isActive === true);
        setExcludedProducts(excluded);
        setApplyToAllProducts(excluded.length === 0);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load tax settings."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
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
      if (!Number.isFinite(number) || number < 0 || number > 100) {
        throw new Error("Tax percentage must be between 0 and 100.");
      }

      const response = await fetch(`${API_URL}/api/admin/tax`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "GST",
          percentage: number,
          isActive,
          applyToAllProducts,
          excludedProducts: applyToAllProducts ? [] : excludedProducts,
        }),
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to save tax settings.");
      }

      setSuccess(data?.message || "Tax settings saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save tax settings."
      );
    } finally {
      setSaving(false);
    }
  }

  const percentageNumber = Number(percentage || 0);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="overflow-hidden rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-8 md:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">
              Extra Add
            </p>
            <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em]">
              Tax Settings
            </h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/65">
              Configure store tax after discounts. Keep All Products on to tax the full catalog, or turn it off and select products that should stay tax-free.
            </p>
          </div>

          <div className="flex min-w-[220px] items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.06] px-5 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#A51D45] text-white">
              <ReceiptText size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">
                Current rate
              </p>
              <p className="mt-1 text-[24px] font-semibold">
                {Number.isFinite(percentageNumber) ? percentageNumber : 0}%
              </p>
            </div>
          </div>
        </div>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <label className="block">
              <span className="text-[12px] font-semibold text-[#211A18]">
                Tax name
              </span>
              <input
                value={name}
                maxLength={100}
                disabled={loading}
                onChange={(event) => setName(event.target.value)}
                placeholder="GST"
                className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px] font-medium text-[#211A18] outline-none focus:border-[#A51D45]/30 focus:ring-4 focus:ring-[#A51D45]/5 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-semibold text-[#211A18]">
                Tax percentage
              </span>
              <div className="mt-3 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={percentage}
                  disabled={loading}
                  onChange={(event) => setPercentage(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-[#211A18] outline-none disabled:opacity-50"
                />
                <span className="text-[13px] font-semibold text-[#211A18]">%</span>
              </div>
            </label>
          </div>

          <div className="mt-5 space-y-3">
            <ToggleRow
              label="Active"
              description="Add this tax to cart and checkout totals."
              checked={isActive}
              onChange={setIsActive}
              disabled={loading}
            />
            <ToggleRow
              label="All Products"
              description="ON = every active product is taxable."
              checked={applyToAllProducts}
              onChange={(value) => {
                setApplyToAllProducts(value);
                if (value) setExcludedProducts([]);
              }}
              disabled={loading}
            />
          </div>

          <div className="mt-5 rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8C1839]">
              Calculation
            </p>
            <p className="mt-2 text-[11px] leading-5 text-[#211A18]/55">
              Tax is calculated on the product amount after automatic and discount-code savings, then added to the final cart total.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="mt-5 h-14 w-full rounded-[14px] bg-[#A51D45] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#8C1839] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Tax Settings"}
          </button>

          <div className="mt-4 rounded-[14px] bg-[#F8F5F2] px-4 py-3 text-[10px] leading-5 text-[#211A18]/50">
            {applyToAllProducts
              ? "All Products is ON. No product is tax-exempt."
              : `${excludedProducts.length} product${excludedProducts.length === 1 ? "" : "s"} excluded from tax.`}
          </div>
        </section>

        <DiscountProductSelector
          selectedIds={excludedProducts}
          onChange={setExcludedProducts}
          disabled={applyToAllProducts}
          title="Tax-exempt products"
          description="When All Products is OFF, checked products will not receive this tax. Use category or search to find products quickly."
          emptySelectionText="No products are tax-exempt."
        />
      </div>
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
        <span className="block text-[12px] font-semibold text-[#211A18]">{label}</span>
        <span className="mt-1 block text-[10px] leading-4 text-[#211A18]/45">
          {description}
        </span>
      </span>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#A51D45]" : "bg-[#211A18]/12"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
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
