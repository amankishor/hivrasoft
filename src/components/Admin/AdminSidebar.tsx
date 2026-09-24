"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

export default function AdminSidebar() {
  const pathname =
    usePathname();

  const productRoute =
    pathname.startsWith(
      "/admin/products",
    );

  const [
    productsOpen,
    setProductsOpen,
  ] = useState(
    productRoute,
  );

  return (
    <aside
      className="
        flex
        max-h-[calc(100dvh-4rem)]
        w-full
        lg:h-dvh
        lg:max-h-none
        flex-col
        bg-[#211A18]
        text-white
      "
    >
      {/* LOGO */}

      <div
        className="
          flex
          h-[82px]
          shrink-0
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
            tracking-[0.2em]
          "
        >
          HIVRASOFT
        </Link>
      </div>

      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          px-4
          py-7
        "
      >
        <p
          className="
            px-3
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.28em]
            text-white/35
          "
        >
          Management
        </p>

        <nav
          className="
            mt-5
            space-y-2
          "
        >
          {/* DASHBOARD */}

          <Link
            href="/admin"
            className={`
              flex
              h-[48px]
              items-center
              gap-3
              rounded-[12px]
              px-4
              text-[11px]
              transition

              ${
                pathname ===
                "/admin"
                  ? "bg-[#A51D45] text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <DashboardIcon />

            Dashboard
          </Link>

          {/* PRODUCTS */}

          <div>
            <button
              type="button"
              aria-expanded={productsOpen}
              aria-controls="admin-products-menu"
              onClick={() =>
                setProductsOpen(
                  (current) =>
                    !current,
                )
              }
              className={`
                flex
                h-[48px]
                w-full
                items-center
                justify-between
                rounded-[12px]
                px-4
                text-[11px]
                transition

                ${
                  productRoute
                    ? "bg-[#A51D45] text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <span
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <ProductIcon />

                Products
              </span>

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`
                  transition-transform

                  ${
                    productsOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* SUB MENU */}

            {productsOpen && (
              <div
                id="admin-products-menu"
                className="
                  mt-2
                  space-y-2
                  pl-3
                "
              >
                <Link
                  href="/admin/products"
                  className={`
                    flex
                    h-[44px]
                    items-center
                    gap-3
                    rounded-[11px]
                    px-4
                    text-[10px]
                    transition

                    ${
                      pathname ===
                      "/admin/products"
                        ? "bg-[#A51D45] text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-current
                    "
                  />

                  All Products
                </Link>

                <Link
                  href="/admin/products/new"
                  className={`
                    flex
                    h-[44px]
                    items-center
                    gap-3
                    rounded-[11px]
                    px-4
                    text-[10px]
                    transition

                    ${
                      pathname ===
                      "/admin/products/new"
                        ? "bg-[#A51D45] text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <span
                    className="
                      flex
                      h-4
                      w-4
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-current
                      text-[11px]
                    "
                  >
                    +
                  </span>

                  Add Product
                </Link>
              </div>
            )}
          </div>

          <MenuLink
            href="/admin/categories"
            active={
              pathname.startsWith(
                "/admin/categories",
              )
            }
          >
            Categories
          </MenuLink>

          <MenuLink
            href="/admin/pages"
            active={
              pathname.startsWith(
                "/admin/pages",
              )
            }
          >
            Pages
          </MenuLink>

          <MenuLink
            href="/admin/banners"
            active={
              pathname.startsWith(
                "/admin/banners",
              )
            }
          >
            Banners
          </MenuLink>

          <MenuLink
            href="/admin/orders"
            active={
              pathname.startsWith(
                "/admin/orders",
              )
            }
          >
            Orders
          </MenuLink>

          <MenuLink
            href="/admin/customers"
            active={
              pathname.startsWith(
                "/admin/customers",
              )
            }
          >
            Customers
          </MenuLink>

          <MenuLink
            href="/admin/notifications"
            active={
              pathname.startsWith(
                "/admin/notifications",
              )
            }
          >
            Notifications
          </MenuLink>

          <MenuLink
            href="/admin/coupons"
            active={
              pathname.startsWith(
                "/admin/coupons",
              )
            }
          >
            Coupons
          </MenuLink>

          <MenuLink
            href="/admin/settings"
            active={
              pathname.startsWith(
                "/admin/settings",
              )
            }
          >
            Settings
          </MenuLink>
        </nav>
      </div>

      {/* STORE */}

      <div
        className="
          border-t
          shrink-0
          border-white/10
          p-4
        "
      >
        <Link
          href="/"
          className="
            flex
            h-[48px]
            items-center
            justify-center
            rounded-[13px]
            border
            border-white/10
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.12em]
            text-white/70

            hover:bg-white
            hover:text-[#211A18]
          "
        >
          View Store
        </Link>
      </div>
    </aside>
  );
}

function MenuLink({
  href,

  active,

  children,
}: {
  href: string;

  active: boolean;

  children:
    React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`
        flex
        h-[48px]
        items-center
        rounded-[12px]
        px-4
        text-[11px]
        transition

        ${
          active
            ? "bg-[#A51D45] text-white"
            : "text-white/65 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      {children}
    </Link>
  );
}

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
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1"
      />

      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1"
      />

      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1"
      />

      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1"
      />
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

      <path d="M4 7v10l8 4 8-4V7M12 11v10" />
    </svg>
  );
}
