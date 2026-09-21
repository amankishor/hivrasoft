"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/new": "Add Product",
  "/admin/categories": "Categories",
  "/admin/pages": "Pages",
  "/admin/banners": "Banners",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/coupons": "Coupons",
  "/admin/settings": "Settings",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  async function signOut() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/logout`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/admin");
      router.refresh();
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  }

  const title =
    titles[pathname] ||
    (pathname.includes("/edit")
      ? "Edit Product"
      : "Admin");

  return (
    <header
      className="
        sticky
        top-0
        z-40
        flex
        h-[78px]
        items-center
        justify-between
        border-b
        border-[#211A18]/10
        bg-[#F7F3EF]/95
        px-5
        backdrop-blur-xl
        md:px-8
      "
    >
      <div>
        <p
          className="
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.22em]
            text-[#8C1839]
          "
        >
          HivraSoft Admin
        </p>

        <h1
          className="
            mt-1
            text-[21px]
            font-semibold
            text-[#211A18]
          "
        >
          {title}
        </h1>
      </div>

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            hidden
            text-right
            sm:block
          "
        >
          <p
            className="
              text-[11px]
              font-semibold
              text-[#211A18]
            "
          >
            Administrator
          </p>

          <p
            className="
              mt-0.5
              text-[9px]
              text-[#211A18]/45
            "
          >
            HivraSoft Management
          </p>
        </div>

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-[#8C1839]
            text-[13px]
            font-semibold
            text-white
          "
        >
          A
        </div>
        <button type="button" onClick={signOut} disabled={loggingOut} aria-label="Sign out" title="Sign out"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#8C1839] hover:bg-[#8C1839]/10 disabled:opacity-50">
          <LogOut size={18} />
        </button>
        {logoutError && <span role="alert" className="text-xs text-red-700">Sign out failed. Try again.</span>}
      </div>
    </header>
  );
}
