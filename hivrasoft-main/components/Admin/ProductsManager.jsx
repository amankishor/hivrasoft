"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   SAFE JSON RESPONSE
========================================================= */

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/* =========================================================
   PRODUCTS MANAGER
========================================================= */

export default function ProductsManager() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionId,
    setActionId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =========================================================
     LOAD PRODUCTS
     GET /api/products
  ========================================================= */

  const loadProducts =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/api/products`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            await readJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                "Unable to load products."
            );
          }

          const productList =
            Array.isArray(
              data.products
            )
              ? data.products
              : [];

          setProducts(
            productList
              .map(
                normalizeProduct
              )
              .filter(
                (
                  product
                ) =>
                  Boolean(
                    product.id
                  )
              )
          );
        } catch (
          error
        ) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load products."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(
    () => {
      void loadProducts();
    },
    [
      loadProducts,
    ]
  );

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  const filteredProducts =
    useMemo(
      () => {
        const text =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (
            product
          ) => {
            const searchMatch =
              !text ||
              product.name
                .toLowerCase()
                .includes(
                  text
                ) ||
              product.slug
                .toLowerCase()
                .includes(
                  text
                ) ||
              product.id
                .toLowerCase()
                .includes(
                  text
                );

            const statusMatch =
              status ===
                "all" ||
              product.status ===
                status;

            return (
              searchMatch &&
              statusMatch
            );
          }
        );
      },
      [
        products,
        search,
        status,
      ]
    );

  /* =========================================================
     UPDATE STATUS
     PATCH /api/products/:id
  ========================================================= */

  const updateStatus =
    async (
      id,
      nextStatus
    ) => {
      if (
        actionId
      ) {
        return;
      }

      try {
        setActionId(id);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/api/products/${id}`,
            {
              method:
                "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify({
                  status:
                    nextStatus,
                }),
            }
          );

        const data =
          await readJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to update product status."
          );
        }

        setProducts(
          (
            current
          ) =>
            current.map(
              (
                product
              ) =>
                product.id ===
                id
                  ? {
                      ...product,
                      status:
                        nextStatus,
                    }
                  : product
            )
        );

        setSuccess(
          nextStatus ===
            "active"
            ? "Product published successfully."
            : nextStatus ===
                "draft"
              ? "Product moved to draft."
              : "Product marked inactive."
        );
      } catch (
        error
      ) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to update product status."
        );
      } finally {
        setActionId(null);
      }
    };

  /* =========================================================
     DELETE PRODUCT
     DELETE /api/products/:id
  ========================================================= */

  const deleteProduct =
    async (
      id,
      name
    ) => {
      if (
        actionId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${name}"?\n\nProduct and its Cloudinary images will also be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setActionId(id);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/api/products/${id}`,
            {
              method:
                "DELETE",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await readJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to delete product."
          );
        }

        setProducts(
          (
            current
          ) =>
            current.filter(
              (
                product
              ) =>
                product.id !==
                id
            )
        );

        const deletedImages =
          typeof data.deletedImages ===
          "number"
            ? data.deletedImages
            : null;

        setSuccess(
          `${data.message || "Product deleted successfully."}${
            deletedImages !==
            null
              ? ` Deleted images: ${deletedImages}.`
              : ""
          }`
        );
      } catch (
        error
      ) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete product."
        );
      } finally {
        setActionId(null);
      }
    };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
      "
    >
      {/* HEADER */}

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
              text-[30px]
              font-semibold
              tracking-tight
              text-[#211A18]
            "
          >
            All Products
          </h1>

          <p
            className="
              mt-1
              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            Products, stock, ratings,
            publishing status and
            product images.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="
            inline-flex
            h-12
            items-center
            justify-center
            rounded-xl
            bg-[#8C1839]
            px-6
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-white
            transition
            hover:bg-[#211A18]
          "
        >
          + Add Product
        </Link>
      </div>

      {/* MESSAGES */}

      {error && (
        <Message tone="error">
          {error}
        </Message>
      )}

      {success && (
        <Message tone="success">
          {success}
        </Message>
      )}

      {/* FILTERS */}

      <section
        className="
          mt-6
          grid
          grid-cols-1
          gap-3
          rounded-2xl
          border
          border-[#211A18]/10
          bg-white
          p-4
          md:grid-cols-[minmax(0,1fr)_220px_auto]
        "
      >
        <div
          className="
            flex
            h-12
            items-center
            gap-3
            rounded-xl
            border
            border-[#211A18]/10
            bg-[#FAF8F6]
            px-4
            focus-within:border-[#8C1839]
          "
        >
          <SearchIcon />

          <input
            type="search"
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by name, ID or slug..."
            className="
              min-w-0
              flex-1
              bg-transparent
              text-[11px]
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
                text-[17px]
                text-[#211A18]/35
                hover:bg-[#211A18]/5
                hover:text-[#8C1839]
              "
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={
            status
          }
          onChange={(
            event
          ) =>
            setStatus(
              event.target.value
            )
          }
          className="
            h-12
            rounded-xl
            border
            border-[#211A18]/10
            bg-[#FAF8F6]
            px-4
            text-[11px]
            outline-none
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

        <button
          type="button"
          disabled={
            loading
          }
          onClick={() =>
            void loadProducts()
          }
          className="
            h-12
            rounded-xl
            border
            border-[#211A18]/10
            bg-white
            px-4
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-[#211A18]/65
            transition
            hover:border-[#8C1839]/20
            hover:text-[#8C1839]
            disabled:opacity-50
          "
        >
          Refresh
        </button>
      </section>

      {/* COUNT */}

      <div
        className="
          mt-4
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-[9px]
            text-[#211A18]/40
          "
        >
          Showing{" "}
          <strong
            className="
              text-[#211A18]
            "
          >
            {
              filteredProducts.length
            }
          </strong>{" "}
          of{" "}
          <strong
            className="
              text-[#211A18]
            "
          >
            {
              products.length
            }
          </strong>{" "}
          products
        </p>

        {(search ||
          status !==
            "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus(
                "all"
              );
            }}
            className="
              text-[8px]
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

      {/* TABLE */}

      <section
        className="
          mt-3
          overflow-hidden
          rounded-2xl
          border
          border-[#211A18]/10
          bg-white
        "
      >
        {/* TABLE HEADER */}

        <div
          className="
            hidden
            grid-cols-[minmax(280px,1.5fr)_120px_90px_110px_110px_300px]
            gap-4
            border-b
            border-[#211A18]/10
            bg-[#FAF8F6]
            px-5
            py-4
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
            Stock
          </ColumnTitle>

          <ColumnTitle>
            Rating
          </ColumnTitle>

          <ColumnTitle>
            Status
          </ColumnTitle>

          <ColumnTitle>
            Actions
          </ColumnTitle>
        </div>

        {/* LOADING */}

        {loading ? (
          <div
            className="
              flex
              min-h-[300px]
              items-center
              justify-center
            "
          >
            <div
              className="
                text-center
              "
            >
              <span
                className="
                  mx-auto
                  block
                  h-7
                  w-7
                  animate-spin
                  rounded-full
                  border-2
                  border-[#211A18]/10
                  border-t-[#8C1839]
                "
              />

              <p
                className="
                  mt-3
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]/35
                "
              >
                Loading products...
              </p>
            </div>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          /* EMPTY */

          <div
            className="
              flex
              min-h-[300px]
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
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-[#F8E5E8]
                text-[#8C1839]
              "
            >
              <BoxIcon />
            </div>

            <p
              className="
                mt-4
                text-[12px]
                font-semibold
                text-[#211A18]
              "
            >
              No products found.
            </p>

            <p
              className="
                mt-1
                text-[9px]
                text-[#211A18]/40
              "
            >
              Add a product or change
              the current filters.
            </p>
          </div>
        ) : (
          /* PRODUCT ROWS */

          filteredProducts.map(
            (
              product
            ) => (
              <ProductRow
                key={
                  product.id
                }
                product={
                  product
                }
                busy={
                  actionId ===
                  product.id
                }
                updateStatus={
                  updateStatus
                }
                deleteProduct={
                  deleteProduct
                }
              />
            )
          )
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
  busy,
  updateStatus,
  deleteProduct,
}) {
  const stock =
    product.totalStock;

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
        last:border-0
        hover:bg-[#FFFCFB]
        xl:grid-cols-[minmax(280px,1.5fr)_120px_90px_110px_110px_300px]
        xl:items-center
        xl:gap-4
      "
    >
      {/* PRODUCT */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >
        <div
          className="
            h-20
            w-16
            shrink-0
            overflow-hidden
            rounded-xl
            border
            border-[#211A18]/8
            bg-[#F3EEE8]
          "
        >
          {product.image ? (
            <img
              src={
                product.image
              }
              alt={
                product.name
              }
              className="
                h-full
                w-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-[7px]
                font-semibold
                uppercase
                text-[#211A18]/25
              "
            >
              No Image
            </div>
          )}
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              truncate
              text-[12px]
              font-semibold
              text-[#211A18]
            "
          >
            {
              product.name
            }
          </p>

          <p
            className="
              mt-1
              line-clamp-2
              text-[9px]
              leading-4
              text-[#211A18]/40
            "
          >
            {
              product.shortDescription ||
              "No description"
            }
          </p>

          <p
            className="
              mt-2
              truncate
              text-[7px]
              text-[#211A18]/30
            "
          >
            {
              product.id
            }
          </p>
        </div>
      </div>

      {/* PRICE */}

      <Cell label="Price">
        <p
          className="
            text-[12px]
            font-semibold
            text-[#211A18]
          "
        >
          ₹
          {
            product.price.toLocaleString(
              "en-IN"
            )
          }
        </p>

        {product.compareAtPrice >
          product.price && (
          <p
            className="
              mt-1
              text-[8px]
              text-[#211A18]/30
              line-through
            "
          >
            ₹
            {
              product.compareAtPrice.toLocaleString(
                "en-IN"
              )
            }
          </p>
        )}
      </Cell>

      {/* STOCK */}

      <Cell label="Stock">
        <p
          className="
            text-[12px]
            font-semibold
            text-[#211A18]
          "
        >
          {
            stock
          }
        </p>

        <p
          className={`
            mt-1
            text-[7px]
            font-medium

            ${
              stock <= 0
                ? "text-red-500"
                : stock <=
                    5
                  ? "text-orange-500"
                  : "text-green-600"
            }
          `}
        >
          {
            stock <= 0
              ? "Out of stock"
              : stock <=
                  5
                ? "Low stock"
                : "In stock"
          }
        </p>
      </Cell>

      {/* RATING */}

      <Cell label="Rating">
        <p
          className="
            text-[10px]
            font-semibold
            text-[#211A18]
          "
        >
          <span
            className="
              text-[#8C1839]
            "
          >
            ★
          </span>{" "}
          {
            product.ratings.average.toFixed(
              1
            )
          }
        </p>

        <p
          className="
            mt-1
            text-[7px]
            text-[#211A18]/30
          "
        >
          {
            product.ratings.count
          }{" "}
          review
          {
            product.ratings.count ===
            1
              ? ""
              : "s"
          }
        </p>
      </Cell>

      {/* STATUS */}

      <Cell label="Status">
        <StatusBadge
          status={
            product.status
          }
        />
      </Cell>

      {/* ACTIONS */}

      <Cell label="Actions">
        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="
              inline-flex
              h-9
              items-center
              justify-center
              rounded-lg
              border
              border-[#211A18]/10
              px-3
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.06em]
              text-[#211A18]
              transition
              hover:border-[#8C1839]/20
              hover:bg-[#FFF7F8]
              hover:text-[#8C1839]
            "
          >
            Edit
          </Link>

          {product.status !==
            "active" && (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void updateStatus(
                  product.id,
                  "active"
                )
              }
              className="
                h-9
                rounded-lg
                bg-green-50
                px-3
                text-[8px]
                font-semibold
                uppercase
                text-green-700
                transition
                hover:bg-green-600
                hover:text-white
                disabled:opacity-50
              "
            >
              {
                busy
                  ? "..."
                  : "Publish"
              }
            </button>
          )}

          {product.status !==
            "draft" && (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void updateStatus(
                  product.id,
                  "draft"
                )
              }
              className="
                h-9
                rounded-lg
                bg-[#F5F1EE]
                px-3
                text-[8px]
                font-semibold
                uppercase
                text-[#211A18]/65
                transition
                hover:bg-[#211A18]
                hover:text-white
                disabled:opacity-50
              "
            >
              {
                busy
                  ? "..."
                  : "Draft"
              }
            </button>
          )}

          <button
            type="button"
            disabled={
              busy
            }
            onClick={() =>
              void deleteProduct(
                product.id,
                product.name
              )
            }
            className="
              h-9
              rounded-lg
              bg-red-50
              px-3
              text-[8px]
              font-semibold
              uppercase
              text-red-600
              transition
              hover:bg-red-600
              hover:text-white
              disabled:opacity-50
            "
          >
            {
              busy
                ? "..."
                : "Delete"
            }
          </button>
        </div>
      </Cell>
    </div>
  );
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(
  product
) {
  const id =
    String(
      product?.id ||
        product?._id ||
        ""
    );

  const mainImage =
    Array.isArray(
      product?.mainImages
    )
      ? product.mainImages.find(
          (
            image
          ) =>
            Boolean(
              image?.url
            )
        )?.url
      : "";

  const allColorImages =
    Array.isArray(
      product?.colors
    )
      ? product.colors.flatMap(
          (
            color
          ) =>
            Array.isArray(
              color?.images
            )
              ? color.images
              : []
        )
      : [];

  const colorImage =
    allColorImages.find(
      (
        image
      ) =>
        Boolean(
          image?.url
        )
    )?.url ||
    "";

  /*
    IMPORTANT:

    New Product model has direct product-level stock:

      product.stock

    So All Products page should show that value.

    For OLD products created before stock field existed,
    fallback to colors[].sizes[].stock total.
  */

  const variantStock =
    Array.isArray(
      product?.colors
    )
      ? product.colors.reduce(
          (
            total,
            color
          ) => {
            const sizes =
              Array.isArray(
                color?.sizes
              )
                ? color.sizes
                : [];

            return (
              total +
              sizes.reduce(
                (
                  sum,
                  size
                ) =>
                  sum +
                  Math.max(
                    0,
                    Number(
                      size?.stock
                    ) ||
                      0
                  ),
                0
              )
            );
          },
          0
        )
      : 0;

  const totalStock =
    product?.stock !==
      undefined &&
    product?.stock !==
      null
      ? Math.max(
          0,
          Number(
            product.stock
          ) ||
            0
        )
      : variantStock;

  const average =
    Math.max(
      0,
      Math.min(
        5,
        Number(
          product?.ratings
            ?.average ||
            0
        )
      )
    );

  const count =
    Math.max(
      0,
      Math.floor(
        Number(
          product?.ratings
            ?.count ||
            0
        )
      )
    );

  const productStatus =
    product?.status ===
      "active" ||
    product?.status ===
      "inactive" ||
    product?.status ===
      "draft"
      ? product.status
      : "draft";

  return {
    id,

    name:
      product?.name ||
      "Unnamed Product",

    slug:
      product?.slug ||
      "",

    shortDescription:
      product?.shortDescription ||
      "",

    price:
      Math.max(
        0,
        Number(
          product?.price ||
            0
        )
      ),

    compareAtPrice:
      Math.max(
        0,
        Number(
          product?.compareAtPrice ||
            0
        )
      ),

    status:
      productStatus,

    image:
      mainImage ||
      colorImage ||
      "",

    totalStock,

    ratings: {
      average,
      count,
    },
  };
}

/* =========================================================
   SMALL UI
========================================================= */

function Cell({
  label,
  children,
}) {
  return (
    <div>
      <p
        className="
          mb-2
          text-[7px]
          font-semibold
          uppercase
          tracking-[0.1em]
          text-[#211A18]/30
          xl:hidden
        "
      >
        {
          label
        }
      </p>

      {
        children
      }
    </div>
  );
}

function ColumnTitle({
  children,
}) {
  return (
    <span
      className="
        text-[8px]
        font-semibold
        uppercase
        tracking-[0.1em]
        text-[#211A18]/40
      "
    >
      {
        children
      }
    </span>
  );
}

function StatusBadge({
  status,
}) {
  const style =
    status ===
    "active"
      ? "bg-green-50 text-green-700"
      : status ===
          "inactive"
        ? "bg-red-50 text-red-600"
        : "bg-[#F4F0ED] text-[#211A18]/60";

  const label =
    status ===
    "active"
      ? "Published"
      : status ===
          "inactive"
        ? "Inactive"
        : "Draft";

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-2
        text-[7px]
        font-semibold
        uppercase
        ${style}
      `}
    >
      {
        label
      }
    </span>
  );
}

function Message({
  tone,
  children,
}) {
  return (
    <div
      className={`
        mt-5
        rounded-xl
        border
        px-4
        py-3
        text-[10px]

        ${
          tone ===
          "error"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-green-200 bg-green-50 text-green-700"
        }
      `}
    >
      {
        children
      }
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="
        shrink-0
        text-[#211A18]/35
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

function BoxIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7 12 3l8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}
