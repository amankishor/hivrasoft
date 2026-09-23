"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   TYPES
========================================================= */

type ProductImage = {
  url: string;
  publicId?: string;
  name?: string;
  alt?: string;
  isDefault?: boolean;
};

type ProductSize = {
  size: string;
  sku: string;
  stock: number;
  isActive?: boolean;
};

type ProductColor = {
  name: string;
  slug?: string;
  hex?: string;

  images?: ProductImage[];

  sizes?: ProductSize[];

  isActive?: boolean;
};

type ProductCategory = {
  _id?: string;
  id?: string;

  name: string;
  slug?: string;
};

type Product = {
  _id?: string;
  id?: string;

  name: string;
  slug: string;

  shortDescription?: string;

  price: number;
  compareAtPrice?: number;

  mainImages?: ProductImage[];

  colors?: ProductColor[];

  categories?: ProductCategory[];

  status?: string;

  isFeatured?: boolean;
  isNewLaunch?: boolean;
};

/* =========================================================
   PRODUCT GRID
========================================================= */

function ProductGrid() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    const loadProducts =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/api/products/active`,
              {
                method: "GET",

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load products."
            );
          }

          /*
           * Multiple backend
           * response shapes support.
           */
          const loadedProducts =
            Array.isArray(
              data.products
            )
              ? data.products
              : Array.isArray(
                    data.data
                  )
                ? data.data
                : Array.isArray(
                      data
                    )
                  ? data
                  : [];

          setProducts(
            loadedProducts
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
      };

    void loadProducts();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <section
        className="
          min-h-[500px]
          bg-[#F8F5F2]
          px-5
          py-16
          md:px-10
          lg:px-16
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1500px]
            items-center
            justify-center
            py-24
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              text-[12px]
              text-[#211A18]/50
            "
          >
            <span
              className="
                h-5
                w-5
                animate-spin
                rounded-full
                border-2
                border-[#211A18]/10
                border-t-[#8C1839]
              "
            />

            Loading products...
          </div>
        </div>
      </section>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <section
        className="
          min-h-[500px]
          bg-[#F8F5F2]
          px-5
          py-16
          md:px-10
          lg:px-16
        "
      >
        <div
          className="
            mx-auto
            max-w-[1500px]
          "
        >
          <div
            className="
              rounded-[16px]
              border
              border-red-200
              bg-red-50
              px-5
              py-4
              text-[12px]
              text-red-600
            "
          >
            {error}
          </div>
        </div>
      </section>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section
      className="
        min-h-screen
        bg-[#F8F5F2]
        px-4
        pb-20
        pt-12

        sm:px-6
        md:px-10
        lg:px-16
      "
    >
      <div
        className="
          mx-auto
          max-w-[1500px]
        "
      >
        {/* HEADER */}

        <div
          className="
            mb-10
            flex
            flex-col
            gap-3

            md:flex-row
            md:items-end
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
                text-[#8C1839]
              "
            >
              Shop Collection
            </p>

            <h1
              className="
                mt-2
                text-[28px]
                font-semibold
                tracking-[-0.02em]
                text-[#211A18]

                md:text-[36px]
              "
            >
              All Products
            </h1>

            <p
              className="
                mt-2
                max-w-[500px]
                text-[11px]
                leading-5
                text-[#211A18]/50
              "
            >
              Explore our complete
              collection.
            </p>
          </div>

          <p
            className="
              text-[10px]
              uppercase
              tracking-[0.12em]
              text-[#211A18]/40
            "
          >
            {products.length}{" "}
            {products.length ===
            1
              ? "Product"
              : "Products"}
          </p>
        </div>

        {/* EMPTY */}

        {products.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[400px]
              flex-col
              items-center
              justify-center
              rounded-[20px]
              border
              border-[#211A18]/10
              bg-white
              px-5
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
                bg-[#F3EEE8]
                text-[#8C1839]
              "
            >
              <BagIcon />
            </div>

            <h2
              className="
                mt-5
                text-[16px]
                font-semibold
                text-[#211A18]
              "
            >
              No products found
            </h2>

            <p
              className="
                mt-2
                text-[10px]
                text-[#211A18]/45
              "
            >
              Active products will
              appear here.
            </p>
          </div>
        ) : (
          /* PRODUCT GRID */

          <div
            className="
              grid
              grid-cols-2
              gap-x-3
              gap-y-8

              sm:gap-x-5

              md:grid-cols-3

              lg:grid-cols-4
              lg:gap-x-6

              xl:grid-cols-4
            "
          >
            {products.map(
              (
                product
              ) => (
                <ProductItem
                  key={
                    product._id ||
                    product.id ||
                    product.slug
                  }
                  product={
                    product
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   PRODUCT ITEM
========================================================= */

function ProductItem({
  product,
}: {
  product: Product;
}) {
  const firstImageData =
    product.mainImages?.[0];

  const hoverImageData =
    product.mainImages?.[1];

  const firstImage =
    firstImageData?.url || "";

  const hoverImage =
    hoverImageData?.url || "";

  const totalStock =
    getTotalStock(
      product
    );

  const hasDiscount =
    Number(
      product.compareAtPrice
    ) >
    Number(
      product.price
    );

  return (
    <article
      className="
        group
        min-w-0
      "
    >
      <Link
        href={`/product/${product.slug}`}
        className="block"
      >
        {/* IMAGE */}

        <div
          className="
            relative
            aspect-[3/4]
            overflow-hidden
            rounded-[14px]
            bg-[#EEE9E4]

            md:rounded-[18px]
          "
        >
          {firstImage ? (
            <>
              <img
                src={
                  firstImage
                }
                alt={
                  firstImageData?.alt ||
                  firstImageData?.name ||
                  product.name
                }
                className={`
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  object-center
                  transition
                  duration-500

                  ${
                    hoverImage
                      ? "group-hover:opacity-0"
                      : "group-hover:scale-[1.02]"
                  }
                `}
              />

              {hoverImage && (
                <img
                  src={
                    hoverImage
                  }
                  alt={
                    hoverImageData?.alt ||
                    hoverImageData?.name ||
                    `${product.name} alternate`
                  }
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    object-center
                    opacity-0
                    transition
                    duration-500

                    group-hover:opacity-100
                  "
                />
              )}
            </>
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-[#211A18]/20
              "
            >
              <BagIcon />
            </div>
          )}

          {/* BADGES */}

          <div
            className="
              absolute
              left-3
              top-3
              z-10
              flex
              flex-col
              items-start
              gap-1.5
            "
          >
            {product.isNewLaunch && (
              <span
                className="
                  rounded-full
                  bg-white
                  px-2.5
                  py-1.5
                  text-[7px]
                  font-semibold
                  uppercase
                  tracking-[0.08em]
                  text-[#8C1839]
                  shadow-sm
                "
              >
                New
              </span>
            )}

            {product.isFeatured && (
              <span
                className="
                  rounded-full
                  bg-[#211A18]
                  px-2.5
                  py-1.5
                  text-[7px]
                  font-semibold
                  uppercase
                  tracking-[0.08em]
                  text-white
                "
              >
                Featured
              </span>
            )}
          </div>

          {/* STOCK */}

          {totalStock <=
            0 && (
            <span
              className="
                absolute
                bottom-3
                left-3
                z-10
                rounded-full
                bg-white/95
                px-2.5
                py-1.5
                text-[7px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-red-500
              "
            >
              Out of stock
            </span>
          )}
        </div>

        {/* DETAILS */}

        <div
          className="
            px-1
            pt-3
          "
        >
          {/* CATEGORIES */}

          {product.categories &&
            product.categories
              .length >
              0 && (
              <p
                className="
                  mb-1.5
                  truncate
                  text-[7px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  text-[#211A18]/35
                "
              >
                {product.categories
                  .map(
                    (
                      category
                    ) =>
                      category.name
                  )
                  .join(
                    " · "
                  )}
              </p>
            )}

          {/* NAME */}

          <h2
            className="
              truncate
              text-[11px]
              font-semibold
              text-[#211A18]

              md:text-[12px]
            "
          >
            {product.name}
          </h2>

          {/* SLUG */}

          <p
            className="
              mt-1
              truncate
              text-[8px]
              text-[#211A18]/35
            "
          >
            /{product.slug}
          </p>

          {/* PRICE */}

          <div
            className="
              mt-2
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                text-[11px]
                font-semibold
                text-[#211A18]
              "
            >
              ₹
              {Number(
                product.price
              ).toLocaleString(
                "en-IN"
              )}
            </span>

            {hasDiscount && (
              <span
                className="
                  text-[9px]
                  text-[#211A18]/35
                  line-through
                "
              >
                ₹
                {Number(
                  product.compareAtPrice
                ).toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
          </div>

          {/* COLORS */}

          {product.colors &&
            product.colors
              .length >
              0 && (
              <div
                className="
                  mt-3
                  flex
                  items-center
                  gap-1.5
                "
              >
                {product.colors
                  .filter(
                    (
                      color
                    ) =>
                      color.isActive !==
                      false
                  )
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (
                      color,
                      index
                    ) => (
                      <span
                        key={`${color.name}-${index}`}
                        title={
                          color.name
                        }
                        className="
                          h-3.5
                          w-3.5
                          rounded-full
                          border
                          border-black/10
                          shadow-[0_0_0_1px_rgba(255,255,255,0.8)]
                        "
                        style={{
                          backgroundColor:
                            color.hex ||
                            "#ddd",
                        }}
                      />
                    )
                  )}
              </div>
            )}
        </div>
      </Link>
    </article>
  );
}

/* =========================================================
   STOCK
========================================================= */

function getTotalStock(
  product: Product
) {
  if (
    !Array.isArray(
      product.colors
    )
  ) {
    return 0;
  }

  return product.colors.reduce(
    (
      productTotal,
      color
    ) => {
      if (
        !Array.isArray(
          color.sizes
        )
      ) {
        return productTotal;
      }

      const colorStock =
        color.sizes.reduce(
          (
            sizeTotal,
            size
          ) =>
            sizeTotal +
            Math.max(
              0,
              Number(
                size.stock
              ) || 0
            ),
          0
        );

      return (
        productTotal +
        colorStock
      );
    },
    0
  );
}

/* =========================================================
   ICON
========================================================= */

function BagIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

/* =========================================================
   EXPORTS
========================================================= */

/*
 * Dono exports diye hain.
 *
 * Ye bhi chalega:
 * import { ProductGrid } from "..."
 *
 * Aur ye bhi chalega:
 * import ProductGrid from "..."
 */

export {
  ProductGrid,
};

export default ProductGrid;