"use client";

import { usePathname } from "next/navigation";

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
      </div>
    </header>
  );
}