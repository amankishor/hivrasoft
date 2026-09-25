import Link from "next/link";

import StatCard from "@/src/components/Admin/StatCard";

export default function AdminDashboardPage() {
  return (
    <div
      className="
        mx-auto
        max-w-[1500px]
      "
    >
      {/* WELCOME */}

      <section
        className="
          rounded-[26px]
          bg-[#211A18]
          px-6
          py-7
          text-white
          md:px-8
          md:py-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.25em]
                text-[#D9B88D]
              "
            >
              Administration
            </p>

            <h2
              className="
                mt-3
                text-[28px]
                font-semibold
                tracking-tight
                md:text-[34px]
              "
            >
              Welcome to HivraSoft
            </h2>

            <p
              className="
                mt-2
                max-w-[600px]
                text-[12px]
                leading-6
                text-white/50
              "
            >
              Manage products, categories,
              inventory, orders and storefront
              content from one dashboard.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="
              inline-flex
              h-[48px]
              items-center
              justify-center
              rounded-[13px]
              bg-[#8C1839]
              px-6
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.15em]
              text-white
              transition
              hover:bg-white
              hover:text-[#211A18]
            "
          >
            + Add Product
          </Link>
        </div>
      </section>

      {/* STATS */}

      <section
        className="
          mt-7
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <StatCard
          title="Products"
          value="0"
          description="Total products available in your catalog."
          icon={<BoxIcon />}
        />

        <StatCard
          title="Orders"
          value="0"
          description="Orders received through your storefront."
          icon={<OrderIcon />}
        />

        <StatCard
          title="Customers"
          value="0"
          description="Registered HivraSoft customer accounts."
          icon={<CustomerIcon />}
        />

        <StatCard
          title="Revenue"
          value="₹0"
          description="Total processed sales revenue."
          icon={<RevenueIcon />}
        />
      </section>

      {/* QUICK ACTIONS */}

      <section
        className="
          mt-7
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-[1.3fr_0.7fr]
        "
      >
        <div
          className="
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
            p-6
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h3
                className="
                  text-[16px]
                  font-semibold
                  text-[#211A18]
                "
              >
                Quick Actions
              </h3>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#211A18]/45
                "
              >
                Common administrative actions.
              </p>
            </div>
          </div>

          <div
            className="
              mt-6
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
            "
          >
            <QuickAction
              href="/admin/products/new"
              title="Add Product"
              description="Create a new product."
            />

            <QuickAction
              href="/admin/categories"
              title="Manage Categories"
              description="Create category hierarchy."
            />

            <QuickAction
              href="/admin/banners"
              title="Manage Banners"
              description="Update storefront banners."
            />

            <QuickAction
              href="/admin/orders"
              title="View Orders"
              description="Review customer orders."
            />
          </div>
        </div>

        {/* STORE STATUS */}

        <div
          className="
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
            p-6
          "
        >
          <h3
            className="
              text-[16px]
              font-semibold
              text-[#211A18]
            "
          >
            Store Status
          </h3>

          <p
            className="
              mt-1
              text-[10px]
              text-[#211A18]/45
            "
          >
            Current backend configuration.
          </p>

          <div
            className="
              mt-6
              space-y-3
            "
          >
            <StatusRow
              label="Backend"
              status="Connected"
            />

            <StatusRow
              label="MongoDB"
              status="Connected"
            />

            <StatusRow
              label="Products API"
              status="Ready"
            />

            <StatusRow
              label="Categories API"
              status="Ready"
            />

            <StatusRow
              label="Cloudinary"
              status="Pending"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-[#FAF8F6]
        p-4
        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:border-[#8C1839]/30
        hover:shadow-md
      "
    >
      <p
        className="
          text-[12px]
          font-semibold
          text-[#211A18]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          text-[10px]
          text-[#211A18]/45
        "
      >
        {description}
      </p>
    </Link>
  );
}

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-[12px]
        bg-[#FAF8F6]
        px-4
        py-3
      "
    >
      <span
        className="
          text-[11px]
          text-[#211A18]/65
        "
      >
        {label}
      </span>

      <span
        className="
          text-[9px]
          font-semibold
          uppercase
          tracking-[0.1em]
          text-[#8C1839]
        "
      >
        {status}
      </span>
    </div>
  );
}

/* ICONS */

function BoxIcon() {
  return (
    <svg
      width="19"
      height="19"
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

function OrderIcon() {
  return (
    <svg
      width="19"
      height="19"
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
      width="19"
      height="19"
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

function RevenueIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 5h10M7 9h10M9 5c4 0 5 5 0 6h-2l8 8" />
    </svg>
  );
}