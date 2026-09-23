"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type MenProduct = {
  id: string;

  name: string;
  slug: string;

  shortDescription: string;

  price: number;
  compareAtPrice: number;

  image: string;
  hoverImage: string;

  colorCount: number;
};

type SortValue =
  | "featured"
  | "low-high"
  | "high-low"
  | "discount";

type MenCatalogProps = {
  products: MenProduct[];

  bannerUrl: string;

  categoryName: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function MenCatalog({
  products,
  bannerUrl,
  categoryName,
}: MenCatalogProps) {
  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured"
    );

  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const items = [
        ...products,
      ];

      switch (sort) {
        case "low-high":
          return items.sort(
            (a, b) =>
              a.price -
              b.price
          );

        case "high-low":
          return items.sort(
            (a, b) =>
              b.price -
              a.price
          );

        case "discount":
          return items.sort(
            (a, b) => {
              const aDiscount =
                a.compareAtPrice >
                a.price
                  ? a.compareAtPrice -
                    a.price
                  : 0;

              const bDiscount =
                b.compareAtPrice >
                b.price
                  ? b.compareAtPrice -
                    b.price
                  : 0;

              return (
                bDiscount -
                aDiscount
              );
            }
          );

        default:
          return items;
      }
    }, [
      products,
      sort,
    ]);

  /* =======================================================
     FIRST 10
     5 PRODUCTS PER ROW
  ======================================================= */

  const featuredProducts =
    sortedProducts.slice(
      0,
      10
    );

  /* =======================================================
     EXTRA PRODUCTS
  ======================================================= */

  const moreProducts =
    sortedProducts.slice(
      10
    );

  /* =======================================================
     COMFORT BANNER PRODUCT IMAGES
  ======================================================= */

  const comfortProducts =
    sortedProducts
      .filter(
        (product) =>
          Boolean(
            product.image
          )
      )
      .slice(
        0,
        4
      );

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden
        bg-[#FCFAF8]
        text-[#292526]
      "
    >
      {/* =================================================
          TOP MEN CATEGORY BANNER
          FULL IMAGE - NO CROP
      ================================================= */}

      {bannerUrl ? (
        <section
          className="
            w-full
            overflow-hidden
            bg-[#F1E8E1]
          "
        >
          <img
            src={bannerUrl}
            alt={categoryName}
            className="
              block
              h-auto
              w-full
            "
          />
        </section>
      ) : null}

      {/* =================================================
          MEN FEATURED PRODUCTS
      ================================================= */}

      <section
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-4
          pb-14
          pt-10

          sm:px-6

          md:px-8
          md:pt-14

          lg:px-10
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            flex-col
            gap-5
            border-b
            border-black/[0.07]
            pb-6

            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.24em]
                text-[#831A2E]
              "
            >
              Men&apos;s Collection
            </p>

            <h1
              className="
                mt-2
                text-[29px]
                font-medium
                tracking-[-0.035em]
                text-[#421D1D]

                sm:text-[35px]
              "
            >
              Featured Collection
            </h1>

            <p
              className="
                mt-2
                max-w-[580px]
                text-[10px]
                leading-5
                text-black/45

                sm:text-[11px]
              "
            >
              Everyday essentials
              designed for comfort,
              movement and
              confidence.
            </p>
          </div>

          {/* SORT */}

          {products.length >
            0 && (
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  hidden
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.13em]
                  text-black/40

                  sm:block
                "
              >
                Sort By
              </span>

              <select
                value={
                  sort
                }
                onChange={(
                  event
                ) =>
                  setSort(
                    event.target
                      .value as SortValue
                  )
                }
                className="
                  h-11
                  min-w-[175px]
                  cursor-pointer
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  px-4
                  text-[10px]
                  outline-none

                  hover:border-[#831A2E]/30
                "
              >
                <option value="featured">
                  Featured
                </option>

                <option value="low-high">
                  Price: Low to High
                </option>

                <option value="high-low">
                  Price: High to Low
                </option>

                <option value="discount">
                  Best Discount
                </option>
              </select>
            </div>
          )}
        </div>

        {/* PRODUCTS */}

        {featuredProducts.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[380px]
              flex-col
              items-center
              justify-center
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
                bg-[#831A2E]/[0.06]
                text-[#831A2E]
              "
            >
              <BoxIcon />
            </div>

            <h2
              className="
                mt-5
                text-[20px]
                font-semibold
              "
            >
              Men&apos;s products
              coming soon
            </h2>

            <p
              className="
                mt-2
                max-w-[420px]
                text-[10px]
                leading-5
                text-black/40
              "
            >
              Product me Men
              category select
              karte hi woh yahan
              automatically
              show hoga.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-8
              grid
              grid-cols-2
              gap-x-3
              gap-y-9

              sm:gap-x-4

              md:grid-cols-3
              md:gap-x-5

              lg:grid-cols-5
              lg:gap-x-5
              lg:gap-y-11
            "
          >
            {featuredProducts.map(
              (
                product,
                index
              ) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  index={
                    index
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      {/* =================================================
          BUILD YOUR COMFORT SET
      ================================================= */}

      {products.length >
        0 && (
        <section
          className="
            mx-auto
            w-full
            max-w-[1500px]
            px-4
            pb-16

            sm:px-6

            md:px-8

            lg:px-10
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[22px]
              border
              border-[#6C3829]/10
              bg-[#EEE0D5]
            "
          >
            <div
              className="
                grid
                min-h-[300px]
                grid-cols-1

                lg:grid-cols-[0.95fr_1.05fr]
              "
            >
              {/* LEFT */}

              <div
                className="
                  relative
                  z-10
                  flex
                  flex-col
                  justify-center
                  px-7
                  py-10

                  sm:px-10

                  lg:px-14
                "
              >
                <p
                  className="
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.24em]
                    text-[#7C3629]
                  "
                >
                  The HivraSoft
                  Men&apos;s Bundle
                </p>

                <h2
                  className="
                    mt-3
                    text-[34px]
                    font-medium
                    leading-[1.02]
                    tracking-[-0.04em]
                    text-[#44201A]

                    sm:text-[43px]
                  "
                >
                  Build Your
                  <br />
                  Comfort Set
                </h2>

                <p
                  className="
                    mt-4
                    max-w-[450px]
                    text-[11px]
                    leading-6
                    text-[#6A5750]
                  "
                >
                  Mix. Match. Save
                  more. Build your
                  everyday essentials
                  around comfort and
                  confidence.
                </p>

                <div
                  className="
                    mt-7
                    flex
                    flex-wrap
                    gap-x-7
                    gap-y-4
                  "
                >
                  <ComfortPoint
                    icon={
                      <HeartIcon />
                    }
                    text="Pick your favourites"
                  />

                  <ComfortPoint
                    icon={
                      <BagIcon />
                    }
                    text="Save more together"
                  />

                  <ComfortPoint
                    icon={
                      <ShieldIcon />
                    }
                    text="Everyday confidence"
                  />
                </div>

                <Link
                  href="#more-to-love"
                  className="
                    mt-7
                    inline-flex
                    h-11
                    w-fit
                    items-center
                    gap-3
                    rounded-full
                    bg-[#672C20]
                    px-6
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-white

                    transition

                    hover:bg-[#451B14]
                  "
                >
                  Explore More
                  <span>
                    →
                  </span>
                </Link>
              </div>

              {/* RIGHT PRODUCT COLLAGE */}

              <div
                className="
                  relative
                  min-h-[310px]
                  overflow-hidden
                  bg-gradient-to-br
                  from-[#D6B8A5]
                  via-[#E7D3C5]
                  to-[#F5EAE2]
                "
              >
                <div
                  className="
                    absolute
                    right-7
                    top-7
                    z-20
                    max-w-[160px]
                    rotate-[-5deg]
                    text-right
                    text-[18px]
                    italic
                    leading-6
                    text-[#633E34]/70
                  "
                >
                  Comfort never
                  looked better
                </div>

                {comfortProducts.map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={
                        product.id
                      }
                      className={`
                        absolute
                        bottom-[-8%]
                        overflow-hidden
                        rounded-[16px]
                        border
                        border-white/40
                        bg-white/40
                        shadow-[0_22px_50px_rgba(60,30,20,0.12)]

                        ${
                          index === 0
                            ? "left-[3%] h-[69%] w-[28%] -rotate-6"
                            : ""
                        }

                        ${
                          index === 1
                            ? "left-[25%] z-10 h-[77%] w-[29%] -rotate-2"
                            : ""
                        }

                        ${
                          index === 2
                            ? "left-[48%] z-10 h-[75%] w-[29%] rotate-2"
                            : ""
                        }

                        ${
                          index === 3
                            ? "right-[1%] h-[68%] w-[27%] rotate-6"
                            : ""
                        }
                      `}
                    >
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
                          object-center
                        "
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================
          MORE TO LOVE
      ================================================= */}

      {moreProducts.length >
        0 && (
        <section
          id="more-to-love"
          className="
            mx-auto
            w-full
            max-w-[1500px]
            px-4
            pb-20

            sm:px-6

            md:px-8

            lg:px-10
          "
        >
          <div
            className="
              border-b
              border-black/[0.07]
              pb-6
            "
          >
            <p
              className="
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.24em]
                text-[#831A2E]
              "
            >
              Keep Exploring
            </p>

            <div
              className="
                mt-2
                flex
                items-end
                justify-between
                gap-5
              "
            >
              <div>
                <h2
                  className="
                    text-[29px]
                    font-medium
                    tracking-[-0.035em]
                    text-[#421D1D]

                    sm:text-[35px]
                  "
                >
                  More To Love
                </h2>

                <p
                  className="
                    mt-2
                    text-[10px]
                    text-black/40
                  "
                >
                  More everyday
                  essentials for
                  him.
                </p>
              </div>

              <span
                className="
                  text-[9px]
                  text-black/35
                "
              >
                {
                  moreProducts.length
                }{" "}
                more products
              </span>
            </div>
          </div>

          <div
            className="
              mt-8
              grid
              grid-cols-2
              gap-x-3
              gap-y-9

              sm:gap-x-4

              md:grid-cols-3
              md:gap-x-5

              lg:grid-cols-5
              lg:gap-x-5
              lg:gap-y-11
            "
          >
            {moreProducts.map(
              (
                product,
                index
              ) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  index={
                    index + 10
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* =================================================
          BENEFITS
          FOOTER ABHI NAHI
      ================================================= */}

      <section
        className="
          border-t
          border-black/[0.05]
          bg-[#F2E8E1]
        "
      >
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1500px]
            grid-cols-2
            gap-y-7
            px-5
            py-8

            md:grid-cols-4
          "
        >
          <Benefit
            icon={
              <LeafIcon />
            }
            title="Skin Friendly"
            text="Gentle on you"
          />

          <Benefit
            icon={
              <AirIcon />
            }
            title="Breathable"
            text="Stay fresh"
          />

          <Benefit
            icon={
              <ShieldIcon />
            }
            title="Premium Quality"
            text="Made to last"
          />

          <Benefit
            icon={
              <TruckIcon />
            }
            title="Free Shipping"
            text="On orders ₹999+"
          />
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  index,
}: {
  product: MenProduct;
  index: number;
}) {
  const hasDiscount =
    product.compareAtPrice >
    product.price;

  const discount =
    hasDiscount
      ? Math.round(
          ((product.compareAtPrice -
            product.price) /
            product.compareAtPrice) *
            100
        )
      : 0;

  return (
    <article
      className="
        group
        min-w-0
      "
    >
      <Link
        href={`/product/${product.slug}`}
        className="
          block
        "
      >
        <div
          className="
            relative
            aspect-[4/5]
            overflow-hidden
            rounded-[13px]
            border
            border-black/[0.05]
            bg-[#F0ECE9]
          "
        >
          <span
            className="
              absolute
              left-3
              top-3
              z-30
              rounded-full
              bg-[#702B22]
              px-2.5
              py-1.5
              text-[7px]
              font-semibold
              uppercase
              text-white
            "
          >
            New
          </span>

          {hasDiscount && (
            <span
              className="
                absolute
                right-3
                top-3
                z-30
                rounded-full
                bg-white/90
                px-2.5
                py-1.5
                text-[7px]
                font-semibold
                text-[#6C241D]
                backdrop-blur
              "
            >
              {discount}% OFF
            </span>
          )}

          {product.image ? (
            <>
              <img
                src={
                  product.image
                }
                alt={
                  product.name
                }
                className={`
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  object-center
                  transition-all
                  duration-500

                  ${
                    product.hoverImage &&
                    product.hoverImage !==
                      product.image
                      ? "group-hover:opacity-0 group-hover:scale-[1.025]"
                      : "group-hover:scale-[1.035]"
                  }
                `}
              />

              {product.hoverImage &&
                product.hoverImage !==
                  product.image && (
                  <img
                    src={
                      product.hoverImage
                    }
                    alt={`${product.name} alternate`}
                    className="
                      absolute
                      inset-0
                      h-full
                      w-full
                      scale-[1.02]
                      object-cover
                      object-center
                      opacity-0
                      transition-all
                      duration-500

                      group-hover:scale-100
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
                items-center
                justify-center
                text-[10px]
                text-black/30
              "
            >
              No Image
            </div>
          )}

          <div
            className="
              absolute
              inset-x-3
              bottom-3
              z-30
              translate-y-3
              opacity-0
              transition-all
              duration-300

              group-hover:translate-y-0
              group-hover:opacity-100
            "
          >
            <div
              className="
                flex
                h-10
                items-center
                justify-center
                rounded-full
                bg-[#3D241E]/95
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.1em]
                text-white
              "
            >
              View Product
            </div>
          </div>
        </div>

        {/* INFO */}

        <div
          className="
            px-1
            pt-3.5
          "
        >
          <h3
            className="
              truncate
              text-[11px]
              font-semibold
              text-[#302725]
            "
          >
            {product.name}
          </h3>

          {product.shortDescription && (
            <p
              className="
                mt-1
                line-clamp-1
                text-[8px]
                text-black/40
              "
            >
              {
                product.shortDescription
              }
            </p>
          )}

          <div
            className="
              mt-2.5
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <strong
              className="
                text-[12px]
                font-semibold
                text-[#2D201D]
              "
            >
              ₹
              {product.price.toLocaleString(
                "en-IN"
              )}
            </strong>

            {hasDiscount && (
              <>
                <span
                  className="
                    text-[8px]
                    text-black/30
                    line-through
                  "
                >
                  ₹
                  {product.compareAtPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span
                  className="
                    rounded-[4px]
                    bg-[#E4F1E5]
                    px-1.5
                    py-1
                    text-[6px]
                    font-semibold
                    text-green-700
                  "
                >
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {product.colorCount >
            0 && (
            <p
              className="
                mt-2
                text-[7px]
                uppercase
                tracking-[0.08em]
                text-black/40
              "
            >
              {
                product.colorCount
              }{" "}
              {product.colorCount ===
              1
                ? "colour"
                : "colours"}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ComfortPoint({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-2
      "
    >
      <span
        className="
          text-[#733529]
        "
      >
        {icon}
      </span>

      <span
        className="
          max-w-[110px]
          text-[8px]
          leading-4
          text-[#50403B]
        "
      >
        {text}
      </span>
    </div>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        gap-3
        px-4

        md:border-r
        md:border-black/[0.07]

        md:last:border-r-0
      "
    >
      <span
        className="
          text-[#77392D]
        "
      >
        {icon}
      </span>

      <div>
        <p
          className="
            text-[9px]
            font-semibold
          "
        >
          {title}
        </p>

        <p
          className="
            mt-0.5
            text-[7px]
            text-black/40
          "
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function HeartIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M20 4c-8 0-14 3-14 9 0 4 3 7 7 7 6 0 8-8 7-16Z" />
      <path d="M6 20c2-5 6-9 11-12" />
    </svg>
  );
}

function AirIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M3 8h10c2 0 3-1 3-2.5S15 3 13.5 3" />
      <path d="M3 12h15c2 0 3 1 3 2.5S20 17 18.5 17" />
      <path d="M3 16h8" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M3 6h11v10H3Z" />
      <path d="M14 10h4l3 3v3h-7Z" />
      <circle
        cx="7"
        cy="18"
        r="2"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}