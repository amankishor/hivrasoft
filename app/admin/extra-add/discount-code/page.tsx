"use client";

import { useEffect, useState } from "react";
import DiscountProductSelector from "@/src/components/Admin/DiscountProductSelector";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type DiscountCodeItem = {
  _id: string;
  code: string;
  percentage: number;
  minAmount?: number;
  maxAmount?: number | null;
  isActive: boolean;
  appliesToAllProducts: boolean;
  productIds: string[];
  createdAt?: string;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function DiscountCodePage() {
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [appliesToAllProducts, setAppliesToAllProducts] = useState(true);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [codes, setCodes] = useState<DiscountCodeItem[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCodes() {
    try {
      setLoadingCodes(true);

      const response = await fetch(
        `${API_URL}/api/admin/discounts/codes`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load discount codes."
        );
      }

      setCodes(
        Array.isArray(data?.codes)
          ? data.codes
          : []
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load discount codes."
      );
    } finally {
      setLoadingCodes(false);
    }
  }

  useEffect(() => {
    void loadCodes();
  }, []);

  async function createCode() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const normalizedCode = code
        .trim()
        .toUpperCase();

      if (!/^[A-Z0-9_-]{3,40}$/.test(normalizedCode)) {
        throw new Error(
          "Code must be 3-40 characters using letters, numbers, _ or -."
        );
      }

      const number = Number(percentage);

      if (
        !Number.isFinite(number) ||
        number <= 0 ||
        number > 100
      ) {
        throw new Error(
          "Discount percentage must be greater than 0 and at most 100."
        );
      }

      const minimum = Number(minAmount);
      const maximum = maxAmount.trim() === "" ? null : Number(maxAmount);

      if (!Number.isFinite(minimum) || minimum < 0) {
        throw new Error("Minimum base price must be 0 or greater.");
      }

      if (
        maximum !== null &&
        (!Number.isFinite(maximum) || maximum < minimum)
      ) {
        throw new Error(
          "Maximum base price must be greater than or equal to minimum base price."
        );
      }

      if (
        !appliesToAllProducts &&
        productIds.length === 0
      ) {
        throw new Error(
          "Select at least one product or turn All Products on."
        );
      }

      const response = await fetch(
        `${API_URL}/api/admin/discounts/codes`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: normalizedCode,
            percentage: number,
            minAmount: minimum,
            maxAmount: maximum,
            isActive,
            appliesToAllProducts,
            productIds: appliesToAllProducts
              ? []
              : productIds,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create discount code."
        );
      }

      setSuccess(
        data?.message ||
          "Discount code created."
      );
      setCode("");
      setPercentage("10");
      setMinAmount("0");
      setMaxAmount("");
      setIsActive(true);
      setAppliesToAllProducts(true);
      setProductIds([]);
      await loadCodes();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create discount code."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCodeActive(item: DiscountCodeItem) {
    try {
      setBusyId(item._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/discounts/codes/${item._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update discount code."
        );
      }

      await loadCodes();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update discount code."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteCode(item: DiscountCodeItem) {
    if (
      !window.confirm(
        `Delete discount code ${item.code}?`
      )
    ) {
      return;
    }

    try {
      setBusyId(item._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/discounts/codes/${item._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete discount code."
        );
      }

      setSuccess(
        data?.message ||
          "Discount code deleted."
      );
      await loadCodes();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete discount code."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-8 md:py-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">
          Extra Add
        </p>
        <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em]">
          Discount Code
        </h2>
        <p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/65">
          Create a code, set its percentage and base-price range, then use All Products or choose exact products using the category dropdown.
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

      <div className="mt-6 grid gap-5 xl:grid-cols-[520px_1fr]">
        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-semibold text-[#211A18]">
                Code
              </span>
              <input
                value={code}
                maxLength={40}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9_-]/g,
                        ""
                      )
                  )
                }
                placeholder="HIVRA10"
                className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px] font-medium uppercase text-[#211A18] outline-none focus:border-[#A51D45]/30 focus:ring-4 focus:ring-[#A51D45]/5"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-semibold text-[#211A18]">
                Discount %
              </span>
              <input
                type="number"
                min={0.01}
                max={100}
                step="0.01"
                value={percentage}
                onChange={(event) =>
                  setPercentage(
                    event.target.value
                  )
                }
                placeholder="10"
                className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px] text-[#211A18] outline-none focus:border-[#A51D45]/30 focus:ring-4 focus:ring-[#A51D45]/5"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-[12px] font-semibold text-[#211A18]">
              Base price range
            </p>
            <p className="mt-1 text-[10px] leading-4 text-[#211A18]/45">
              This code applies only when the cart base subtotal is inside this range. Leave Maximum blank for no upper limit.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-medium text-[#211A18]/55">
                  Minimum
                </span>
                <div className="mt-2 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                  <span className="mr-2 text-[12px] font-semibold text-[#211A18]/45">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={minAmount}
                    onChange={(event) => setMinAmount(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#211A18] outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-medium text-[#211A18]/55">
                  Maximum
                </span>
                <div className="mt-2 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                  <span className="mr-2 text-[12px] font-semibold text-[#211A18]/45">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={maxAmount}
                    onChange={(event) => setMaxAmount(event.target.value)}
                    placeholder="No limit"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-[#211A18] outline-none"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <ToggleRow
              label="All Products"
              description="ON = this code works on every active product."
              checked={appliesToAllProducts}
              onChange={(value) => {
                setAppliesToAllProducts(value);
                if (value) {
                  setProductIds([]);
                }
              }}
            />

            <ToggleRow
              label="Active"
              description="Customers can use this code while it is active."
              checked={isActive}
              onChange={setIsActive}
            />
          </div>

          <button
            type="button"
            onClick={() => void createCode()}
            disabled={saving}
            className="mt-5 h-14 w-full rounded-[14px] bg-[#A51D45] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#8C1839] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Creating..."
              : "Create Discount Code"}
          </button>

          <p className="mt-4 text-[10px] leading-5 text-[#211A18]/45">
            Valid code example: HIVRA10. Use 3-40 letters, numbers, _ or -.
          </p>
        </section>

        <DiscountProductSelector
          selectedIds={productIds}
          onChange={setProductIds}
          disabled={appliesToAllProducts}
          title="Products for this code"
          description="Choose All Products, or turn it off and select products. Filter by category or search by product name."
          emptySelectionText="No individual products selected."
        />
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#211A18]/8 pb-5">
          <div>
            <h3 className="text-[18px] font-semibold text-[#211A18]">
              Created Codes
            </h3>
            <p className="mt-1 text-[11px] text-[#211A18]/40">
              Active/inactive status, price range and product scope are shown here.
            </p>
          </div>
          <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">
            {codes.length} code{codes.length === 1 ? "" : "s"}
          </span>
        </div>

        {loadingCodes ? (
          <div className="py-12 text-center text-[12px] text-[#211A18]/40">
            Loading discount codes...
          </div>
        ) : codes.length === 0 ? (
          <div className="py-12 text-center text-[12px] text-[#211A18]/40">
            No discount code created yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.08em] text-[#211A18]/40">
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Discount</th>
                  <th className="px-3 py-2">Base price range</th>
                  <th className="px-3 py-2">Products</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((item) => (
                  <tr
                    key={item._id}
                    className="bg-[#FAF8F6] text-[12px] text-[#211A18]"
                  >
                    <td className="rounded-l-[14px] px-3 py-3 font-semibold">
                      {item.code}
                    </td>
                    <td className="px-3 py-3">
                      {item.percentage}%
                    </td>
                    <td className="px-3 py-3 text-[#211A18]/60">
                      ₹{Number(item.minAmount ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      {item.maxAmount === null || item.maxAmount === undefined
                        ? " +"
                        : ` – ₹${Number(item.maxAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-3 py-3 text-[#211A18]/60">
                      {item.appliesToAllProducts
                        ? "All Products"
                        : `${Array.isArray(item.productIds) ? item.productIds.length : 0} selected`}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#EEEAE6] text-[#211A18]/50"
                        }`}
                      >
                        {item.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td className="rounded-r-[14px] px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === item._id}
                          onClick={() =>
                            void toggleCodeActive(item)
                          }
                          className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold text-[#211A18]/65 disabled:opacity-40"
                        >
                          {item.isActive
                            ? "Disable"
                            : "Enable"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item._id}
                          onClick={() =>
                            void deleteCode(item)
                          }
                          className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
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
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
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
