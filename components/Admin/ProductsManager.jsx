"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/* =========================================================
   DEMO PRODUCTS
   API READY HONE KE BAAD ISKO API DATA SE REPLACE KAR DENA
========================================================= */

const DEMO_PRODUCTS = [
  {
    id: "PRD-1001",
    name: "Everyday Comfort Bra",
    shortDescription:
      "Soft everyday bra with breathable fabric and comfortable support.",
    price: 1299,
    compareAtPrice: 1699,
    status: "active",
    totalStock: 32,
    image:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=500&q=85",
  },

  {
    id: "PRD-1002",
    name: "Floral Midi Dress",
    shortDescription:
      "Elegant floral midi dress for casual and evening styling.",
    price: 2199,
    compareAtPrice: 2799,
    status: "active",
    totalStock: 18,
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=500&q=85",
  },

  {
    id: "PRD-1003",
    name: "Classic White Top",
    shortDescription:
      "Minimal white top with a clean silhouette and soft texture.",
    price: 899,
    compareAtPrice: 1199,
    status: "draft",
    totalStock: 8,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=500&q=85",
  },

  {
    id: "PRD-1004",
    name: "Textured Shoulder Bag",
    shortDescription:
      "Compact shoulder bag with premium textured finish.",
    price: 1799,
    compareAtPrice: 2299,
    status: "active",
    totalStock: 5,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=85",
  },

  {
    id: "PRD-1005",
    name: "Premium Linen Kurta Set",
    shortDescription:
      "Lightweight linen blend kurta set with an elegant everyday finish.",
    price: 2499,
    compareAtPrice: 3199,
    status: "draft",
    totalStock: 14,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=85",
  },

  {
    id: "PRD-1006",
    name: "Summer Fashion Top",
    shortDescription:
      "Relaxed fit summer top designed for lightweight comfort.",
    price: 1099,
    compareAtPrice: 1499,
    status: "inactive",
    totalStock: 0,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=85",
  },
];

/* =========================================================
   PRODUCTS MANAGER
========================================================= */

export default function ProductsManager() {
  const [products, setProducts] =
    useState(DEMO_PRODUCTS);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !searchText ||
            product.name
              .toLowerCase()
              .includes(
                searchText,
              ) ||
            product.id
              .toLowerCase()
              .includes(
                searchText,
              );

          const matchesStatus =
            status === "all" ||
            product.status ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      products,
      search,
      status,
    ]);

  /* =======================================================
     STATUS UPDATE
     ABHI SIRF FRONTEND STATE
  ======================================================= */

  const updateStatus = (
    productId,
    nextStatus,
  ) => {
    setProducts(
      (currentProducts) =>
        currentProducts.map(
          (product) =>
            product.id ===
            productId
              ? {
                  ...product,
                  status:
                    nextStatus,
                }
              : product,
        ),
    );
  };

  /* =======================================================
     DELETE
     ABHI SIRF FRONTEND STATE
  ======================================================= */

  const deleteProduct = (
    productId,
    productName,
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${productName}"?\n\nThis product will be removed from the demo list.`,
      );

    if (!confirmed) {
      return;
    }

    setProducts(
      (currentProducts) =>
        currentProducts.filter(
          (product) =>
            product.id !==
            productId,
        ),
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        mx-auto
        max-w-[1500px]
      "
    >
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div
        className="
          flex
          flex-col
          gap-5

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.24em]
              text-[#8C1839]
            "
          >
            Catalog Management
          </p>

          <h1
            className="
              mt-2
              text-[28px]
              font-semibold
              tracking-tight
              text-[#211A18]

              md:text-[32px]
            "
          >
            All Products
          </h1>

          <p
            className="
              mt-2
              max-w-[650px]
              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            Manage all products,
            inventory, publishing
            status and product
            information.
          </p>
        </div>

        {/* ADD PRODUCT */}

        <Link
          href="/admin/products/new"
          className="
            inline-flex
            h-[48px]
            items-center
            justify-center
            gap-2
            rounded-[12px]
            bg-[#8C1839]
            px-6
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.12em]
            text-white
            transition
            duration-200

            hover:bg-[#211A18]
          "
        >
          <span
            className="
              text-[18px]
              leading-none
            "
          >
            +
          </span>

          Add Product
        </Link>
      </div>

      {/* ===================================================
          SEARCH + FILTER AREA
      =================================================== */}

      <section
        className="
          mt-6
          rounded-[20px]
          border
          border-[#211A18]/10
          bg-white
          p-4
        "
      >
        <div
          className="
            grid
            grid-cols-1
            gap-3

            md:grid-cols-[minmax(0,1fr)_220px]
          "
        >
          {/* SEARCH */}

          <div
            className="
              flex
              h-[50px]
              items-center
              gap-3
              rounded-[12px]
              border
              border-[#211A18]/10
              bg-[#FAF8F6]
              px-4
              transition

              focus-within:border-[#8C1839]
              focus-within:ring-4
              focus-within:ring-[#8C1839]/5
            "
          >
            <SearchIcon />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search by product name or ID..."
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[12px]
                text-[#211A18]
                outline-none

                placeholder:text-[#211A18]/30
              "
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  text-[18px]
                  text-[#211A18]/40
                  transition

                  hover:bg-[#211A18]/5
                  hover:text-[#8C1839]
                "
              >
                ×
              </button>
            )}
          </div>

          {/* STATUS FILTER */}

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target
                  .value,
              )
            }
            className="
              h-[50px]
              rounded-[12px]
              border
              border-[#211A18]/10
              bg-[#FAF8F6]
              px-4
              text-[11px]
              text-[#211A18]
              outline-none
              transition

              focus:border-[#8C1839]
            "
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Published
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </section>

      {/* ===================================================
          RESULT INFO
      =================================================== */}

      <div
        className="
          mt-5
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-[10px]
            text-[#211A18]/45
          "
        >
          Showing{" "}
          <span
            className="
              font-semibold
              text-[#211A18]
            "
          >
            {
              filteredProducts.length
            }
          </span>{" "}
          of{" "}
          <span
            className="
              font-semibold
              text-[#211A18]
            "
          >
            {products.length}
          </span>{" "}
          products
        </p>

        {(search ||
          status !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.08em]
              text-[#8C1839]

              hover:underline
            "
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ===================================================
          PRODUCTS TABLE
      =================================================== */}

      <section
        className="
          mt-3
          overflow-hidden
          rounded-[20px]
          border
          border-[#211A18]/10
          bg-white
        "
      >
        {/* TABLE HEADER */}

        <div
          className="
            hidden
            min-h-[54px]
            grid-cols-[minmax(310px,1.6fr)_140px_120px_140px_330px]
            items-center
            gap-4
            border-b
            border-[#211A18]/10
            bg-[#FAF8F6]
            px-5

            xl:grid
          "
        >
          <ColumnTitle>
            Product
          </ColumnTitle>

          <ColumnTitle>
            Price
          </ColumnTitle>

          <ColumnTitle>
            Quantity
          </ColumnTitle>

          <ColumnTitle>
            Status
          </ColumnTitle>

          <ColumnTitle>
            Actions
          </ColumnTitle>
        </div>

        {/* PRODUCTS */}

        {filteredProducts.length >
        0 ? (
          filteredProducts.map(
            (product) => (
              <ProductRow
                key={
                  product.id
                }
                product={
                  product
                }
                updateStatus={
                  updateStatus
                }
                deleteProduct={
                  deleteProduct
                }
              />
            ),
          )
        ) : (
          <EmptyProducts />
        )}
      </section>
    </div>
  );
}

/* =========================================================
   PRODUCT ROW
========================================================= */

function ProductRow({
  product,
  updateStatus,
  deleteProduct,
}) {
  const stock =
    Number(
      product.totalStock,
    ) || 0;

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-5
        border-b
        border-[#211A18]/8
        px-5
        py-5
        transition

        last:border-b-0

        hover:bg-[#FFFCFB]

        xl:grid-cols-[minmax(310px,1.6fr)_140px_120px_140px_330px]
        xl:items-center
        xl:gap-4
      "
    >
      {/* ===================================================
          PRODUCT
      =================================================== */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >
        {/* IMAGE */}

        <div
          className="
            h-[96px]
            w-[76px]
            shrink-0
            overflow-hidden
            rounded-[13px]
            border
            border-[#211A18]/8
            bg-[#F2ECE8]
          "
        >
          <img
            src={product.image}
            alt={product.name}
            className="
              h-full
              w-full
              object-cover
              object-center
              transition
              duration-300

              hover:scale-105
            "
          />
        </div>

        {/* TITLE */}

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              truncate
              text-[13px]
              font-semibold
              text-[#211A18]
            "
          >
            {product.name}
          </p>

          <p
            className="
              mt-1
              line-clamp-2
              max-w-[430px]
              text-[10px]
              leading-5
              text-[#211A18]/45
            "
          >
            {
              product.shortDescription
            }
          </p>

          <div
            className="
              mt-2
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                rounded-[5px]
                bg-[#F5F1EE]
                px-2
                py-1
                text-[8px]
                font-medium
                tracking-[0.05em]
                text-[#211A18]/45
              "
            >
              {product.id}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          PRICE
      =================================================== */}

      <TableCell
        label="Price"
      >
        <div>
          <p
            className="
              text-[13px]
              font-semibold
              text-[#211A18]
            "
          >
            ₹
            {product.price.toLocaleString(
              "en-IN",
            )}
          </p>

          {product.compareAtPrice >
            product.price && (
            <p
              className="
                mt-1
                text-[9px]
                text-[#211A18]/35
                line-through
              "
            >
              ₹
              {product.compareAtPrice.toLocaleString(
                "en-IN",
              )}
            </p>
          )}
        </div>
      </TableCell>

      {/* ===================================================
          QUANTITY
      =================================================== */}

      <TableCell
        label="Quantity"
      >
        <div>
          <p
            className="
              text-[14px]
              font-semibold
              text-[#211A18]
            "
          >
            {stock}
          </p>

          <p
            className={`
              mt-1
              text-[8px]
              font-medium

              ${
                stock <= 0
                  ? "text-red-500"
                  : stock <= 5
                    ? "text-orange-500"
                    : "text-green-600"
              }
            `}
          >
            {stock <= 0
              ? "Out of stock"
              : stock <= 5
                ? "Low stock"
                : "In stock"}
          </p>
        </div>
      </TableCell>

      {/* ===================================================
          STATUS
      =================================================== */}

      <TableCell
        label="Status"
      >
        <StatusBadge
          status={
            product.status
          }
        />
      </TableCell>

      {/* ===================================================
          ACTIONS
      =================================================== */}

      <TableCell
        label="Actions"
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          {/* EDIT */}

          <Link
            href={`/admin/products/${product.id}/edit`}
            className="
              inline-flex
              h-[36px]
              items-center
              justify-center
              gap-1.5
              rounded-[9px]
              border
              border-[#211A18]/10
              bg-white
              px-3
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.07em]
              text-[#211A18]
              transition

              hover:border-[#8C1839]/25
              hover:bg-[#FFF7F8]
              hover:text-[#8C1839]
            "
          >
            <EditIcon />

            Edit
          </Link>

          {/* PUBLISH */}

          {product.status !==
            "active" && (
            <button
              type="button"
              onClick={() =>
                updateStatus(
                  product.id,
                  "active",
                )
              }
              className="
                inline-flex
                h-[36px]
                items-center
                justify-center
                rounded-[9px]
                bg-green-50
                px-3
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.07em]
                text-green-700
                transition

                hover:bg-green-600
                hover:text-white
              "
            >
              Publish
            </button>
          )}

          {/* DRAFT */}

          {product.status !==
            "draft" && (
            <button
              type="button"
              onClick={() =>
                updateStatus(
                  product.id,
                  "draft",
                )
              }
              className="
                inline-flex
                h-[36px]
                items-center
                justify-center
                rounded-[9px]
                bg-[#F5F1EE]
                px-3
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.07em]
                text-[#211A18]/65
                transition

                hover:bg-[#211A18]
                hover:text-white
              "
            >
              Draft
            </button>
          )}

          {/* DELETE */}

          <button
            type="button"
            onClick={() =>
              deleteProduct(
                product.id,
                product.name,
              )
            }
            className="
              inline-flex
              h-[36px]
              items-center
              justify-center
              gap-1.5
              rounded-[9px]
              bg-red-50
              px-3
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.07em]
              text-red-600
              transition

              hover:bg-red-600
              hover:text-white
            "
          >
            <TrashIcon />

            Delete
          </button>
        </div>
      </TableCell>
    </div>
  );
}

/* =========================================================
   TABLE CELL
========================================================= */

function TableCell({
  label,
  children,
}) {
  return (
    <div>
      <p
        className="
          mb-2
          text-[8px]
          font-semibold
          uppercase
          tracking-[0.13em]
          text-[#211A18]/35

          xl:hidden
        "
      >
        {label}
      </p>

      {children}
    </div>
  );
}

/* =========================================================
   COLUMN TITLE
========================================================= */

function ColumnTitle({
  children,
}) {
  return (
    <span
      className="
        text-[8px]
        font-semibold
        uppercase
        tracking-[0.14em]
        text-[#211A18]/40
      "
    >
      {children}
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  if (
    status === "active"
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-green-50
          px-3
          py-2
          text-[8px]
          font-semibold
          uppercase
          tracking-[0.08em]
          text-green-700
        "
      >
        <span
          className="
            h-1.5
            w-1.5
            rounded-full
            bg-green-600
          "
        />

        Published
      </span>
    );
  }

  if (
    status === "inactive"
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-red-50
          px-3
          py-2
          text-[8px]
          font-semibold
          uppercase
          tracking-[0.08em]
          text-red-600
        "
      >
        <span
          className="
            h-1.5
            w-1.5
            rounded-full
            bg-red-500
          "
        />

        Inactive
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-[#F4F0ED]
        px-3
        py-2
        text-[8px]
        font-semibold
        uppercase
        tracking-[0.08em]
        text-[#211A18]/60
      "
    >
      <span
        className="
          h-1.5
          w-1.5
          rounded-full
          bg-[#211A18]/35
        "
      />

      Draft
    </span>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyProducts() {
  return (
    <div
      className="
        flex
        min-h-[360px]
        flex-col
        items-center
        justify-center
        px-6
        text-center
      "
    >
      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-[#F8E5E8]
          text-[#8C1839]
        "
      >
        <BoxIcon />
      </div>

      <h3
        className="
          mt-4
          text-[15px]
          font-semibold
          text-[#211A18]
        "
      >
        No products found
      </h3>

      <p
        className="
          mt-2
          max-w-[330px]
          text-[10px]
          leading-5
          text-[#211A18]/45
        "
      >
        Try changing the product
        search or status filter.
      </p>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="
        shrink-0
        text-[#211A18]/40
      "
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />

      <path d="M8 6V4h8v2" />

      <path d="M19 6l-1 14H6L5 6" />

      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M4 7 12 3l8 4-8 4-8-4Z" />

      <path d="M4 7v10l8 4 8-4V7M12 11v10" />
    </svg>
  );
}