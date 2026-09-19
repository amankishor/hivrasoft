"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: DashboardIcon,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: ProductIcon,
  },
  {
    label: "Add Product",
    href: "/admin/products/new",
    icon: PlusIcon,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: CategoryIcon,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: PagesIcon,
  },
  {
    label: "Banners",
    href: "/admin/banners",
    icon: BannerIcon,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: OrderIcon,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: CustomerIcon,
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    icon: CouponIcon,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: SettingsIcon,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-50
        hidden
        h-screen
        w-[260px]
        flex-col
        border-r
        border-white/10
        bg-[#211A18]
        lg:flex
      "
    >
      {/* LOGO */}

      <div
        className="
          flex
          h-[78px]
          items-center
          border-b
          border-white/10
          px-7
        "
      >
        <Link
          href="/admin"
          className="
            text-[20px]
            font-semibold
            tracking-[0.18em]
            text-white
          "
        >
          HIVRASOFT
        </Link>
      </div>

      {/* MENU */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-4
          py-6
        "
      >
        <p
          className="
            mb-3
            px-3
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.25em]
            text-white/35
          "
        >
          Management
        </p>

        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  h-[46px]
                  items-center
                  gap-3
                  rounded-[12px]
                  px-3.5
                  text-[12px]
                  font-medium
                  transition-all
                  duration-200

                  ${
                    active
                      ? "bg-[#8C1839] text-white shadow-lg"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM */}

      <div
        className="
          border-t
          border-white/10
          p-4
        "
      >
        <Link
          href="/"
          className="
            flex
            h-[44px]
            items-center
            justify-center
            rounded-[12px]
            border
            border-white/10
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.15em]
            text-white/60
            transition
            hover:border-white/25
            hover:bg-white/5
            hover:text-white
          "
        >
          View Store
        </Link>
      </div>
    </aside>
  );
}

/* =========================================================
   ICONS
========================================================= */

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7 12 3l8 4-8 4-8-4Z" />
      <path d="m4 7 8 4 8-4" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
    </svg>
  );
}

function PagesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 3h10l4 4v14H7z" />
      <path d="M17 3v5h4" />
      <path d="M10 12h8M10 16h8" />
    </svg>
  );
}

function BannerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="10" r="1.5" />
      <path d="m5 17 5-5 3 3 2-2 4 4" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 3.6-6 8-6s7 2 8 6" />
    </svg>
  );
}

function CouponIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4V7Z" />
      <path d="m9 15 6-6" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="15" r="1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}