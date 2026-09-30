"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  ScrollTrigger,
} from "gsap/ScrollTrigger";

/* =========================================================
   PRODUCT TYPE
========================================================= */

export type NewLaunchProduct = {
  id: string;

  name: string;

  slug: string;

  shortDescription?: string;

  price: number;

  compareAtPrice: number;

  image: string;

  hoverImage?: string;

  colorCount?: number;

  gender:
    | "men"
    | "women";
};

/* =========================================================
   PROPS
========================================================= */

type NewLaunchCatalogProps = {
  products:
    NewLaunchProduct[];

  bannerUrl: string;

  categoryName: string;
};

/* =========================================================
   SORT
========================================================= */

type SortValue =
  | "featured"
  | "low-high"
  | "high-low"
  | "discount";

/* =========================================================
   DISCOUNT
========================================================= */

function getDiscount(
  product:
    NewLaunchProduct
): number {
  const original =
    Number(
      product.compareAtPrice
    );

  const current =
    Number(
      product.price
    );

  if (
    original <= 0 ||
    current <= 0 ||
    original <=
      current
  ) {
    return 0;
  }

  return Math.round(
    ((original -
      current) /
      original) *
      100
  );
}

/* =========================================================
   CARD
========================================================= */

function ProductCard({
  product,
}: {
  product:
    NewLaunchProduct;
}) {
  const discount =
    getDiscount(
      product
    );

  return (
    <article
      className="
        new-launch-card
        group

        w-[235px]
        shrink-0

        sm:w-[255px]

        lg:w-[270px]
      "
    >
      {/* =====================================================
          IMAGE
      ===================================================== */}

      <Link
        href={`/product/${product.slug}`}
        className="
          relative

          block

          aspect-[4/5]

          overflow-hidden

          rounded-[18px]

          border
          border-black/[0.06]

          bg-[#F2EFEC]
        "
      >
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
                  product.hoverImage
                    ? "group-hover:scale-[1.025] group-hover:opacity-0"
                    : "group-hover:scale-[1.035]"
                }
              `}
            />

            {product.hoverImage && (
              <img
                src={
                  product.hoverImage
                }
                alt={
                  product.name
                }
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

              text-[11px]
              text-black/30
            "
          >
            No Image
          </div>
        )}

        {/* NEW */}

        <span
          className="
            absolute
            left-3
            top-3
            z-20

            rounded-full

            bg-[#292726]

            px-3
            py-1.5

            text-[9px]
            font-semibold
            uppercase
            tracking-[0.08em]
            text-white
          "
        >
          New
        </span>

        {/* DISCOUNT */}

        {discount >
          0 && (
          <span
            className="
              absolute
              bottom-3
              left-3
              z-20

              rounded-full

              bg-[#B41443]

              px-3
              py-1.5

              text-[9px]
              font-semibold
              text-white
            "
          >
            {discount}% OFF
          </span>
        )}

        {/* WISHLIST */}

        <span
          className="
            absolute
            right-3
            top-3
            z-20

            flex
            h-9
            w-9
            items-center
            justify-center

            rounded-full

            bg-white

            text-[19px]
            text-[#B41443]

            shadow-sm
          "
        >
          ♡
        </span>
      </Link>

      {/* =====================================================
          INFO
      ===================================================== */}

      <div
        className="
          px-1
          pt-3
        "
      >
        <Link
          href={`/product/${product.slug}`}
          className="
            block

            min-h-[39px]

            text-[13px]
            font-medium
            leading-[1.45]

            text-[#211A18]

            transition

            hover:text-[#B41443]
          "
        >
          {product.name}
        </Link>

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
          <strong
            className="
              text-[15px]
            "
          >
            ₹
            {product.price.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )}
          </strong>

          {product.compareAtPrice >
            product.price && (
            <span
              className="
                text-[10px]
                text-black/30
                line-through
              "
            >
              ₹
              {product.compareAtPrice.toLocaleString(
                "en-IN"
              )}
            </span>
          )}

          {discount >
            0 && (
            <span
              className="
                rounded-full

                bg-[#F8E5E8]

                px-2
                py-1

                text-[8px]
                font-semibold
                text-[#B41443]
              "
            >
              {discount}% OFF
            </span>
          )}
        </div>

        {/* EXPLORE */}

        <Link
          href={`/product/${product.slug}`}
          className="
            mt-3

            flex
            h-10
            w-full

            items-center
            justify-center

            rounded-[8px]

            bg-[#292726]

            text-[9px]
            font-semibold
            uppercase
            tracking-[0.07em]
            text-white

            transition

            hover:bg-[#B41443]
          "
        >
          Explore
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function NewLaunchCatalog({
  products,
  bannerUrl,
  categoryName,
}: NewLaunchCatalogProps) {
  /* =======================================================
     COUNTS
  ======================================================= */

  const menCount =
    products.filter(
      (
        product
      ) =>
        product.gender ===
        "men"
    ).length;

  const womenCount =
    products.filter(
      (
        product
      ) =>
        product.gender ===
        "women"
    ).length;

  /*
   * Important:
   *
   * Men products available hain to page
   * MEN se open hoga.
   *
   * Warna Women.
   */

  const initialGender:
    | "men"
    | "women" =
    menCount > 0
      ? "men"
      : "women";

  const [
    gender,
    setGender,
  ] =
    useState<
      "men" | "women"
    >(
      initialGender
    );

  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured"
    );

  const rootRef =
    useRef<HTMLElement | null>(
      null
    );

  const headingRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const trackRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const genderProducts =
    useMemo(
      () =>
        products.filter(
          (
            product
          ) =>
            product.gender ===
            gender
        ),
      [
        products,
        gender,
      ]
    );

  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const list = [
        ...genderProducts,
      ];

      if (
        sort ===
        "low-high"
      ) {
        list.sort(
          (
            a,
            b
          ) =>
            a.price -
            b.price
        );
      }

      if (
        sort ===
        "high-low"
      ) {
        list.sort(
          (
            a,
            b
          ) =>
            b.price -
            a.price
        );
      }

      if (
        sort ===
        "discount"
      ) {
        list.sort(
          (
            a,
            b
          ) =>
            getDiscount(
              b
            ) -
            getDiscount(
              a
            )
        );
      }

      return list;
    }, [
      genderProducts,
      sort,
    ]);

  /* =======================================================
     SCROLLTRIGGER
  ======================================================= */

  useEffect(() => {
    gsap.registerPlugin(
      ScrollTrigger
    );

    const ctx =
      gsap.context(
        () => {
          /* heading */

          if (
            headingRef.current
          ) {
            gsap.fromTo(
              headingRef.current,
              {
                opacity: 0,

                y: 30,
              },
              {
                opacity: 1,

                y: 0,

                duration: 0.75,

                ease:
                  "power3.out",

                scrollTrigger: {
                  trigger:
                    headingRef.current,

                  start:
                    "top 88%",

                  once: true,
                },
              }
            );
          }

          /* cards */

          if (
            trackRef.current
          ) {
            gsap.fromTo(
              trackRef.current
                .children,
              {
                opacity: 0,

                y: 30,

                scale: 0.97,
              },
              {
                opacity: 1,

                y: 0,

                scale: 1,

                stagger: 0.06,

                duration: 0.6,

                ease:
                  "power3.out",

                scrollTrigger: {
                  trigger:
                    trackRef.current,

                  start:
                    "top 90%",

                  once: true,
                },
              }
            );
          }
        },
        rootRef
      );

    return () =>
      ctx.revert();
  }, []);

  /* =======================================================
     GENDER CLICK
  ======================================================= */

  function changeGender(
    next:
      | "men"
      | "women"
  ) {
    if (
      next ===
      gender
    ) {
      return;
    }

    const track =
      trackRef.current;

    if (
      !track ||
      track.children
        .length === 0
    ) {
      setGender(
        next
      );

      return;
    }

    gsap.to(
      track.children,
      {
        opacity: 0,

        x: -18,

        stagger: 0.025,

        duration: 0.18,

        ease:
          "power2.in",

        onComplete:
          () =>
            setGender(
              next
            ),
      }
    );
  }

  /* =======================================================
     ANIMATE AFTER TAB / SORT CHANGE
  ======================================================= */

  useEffect(() => {
    const track =
      trackRef.current;

    if (
      !track ||
      track.children
        .length === 0
    ) {
      return;
    }

    gsap.killTweensOf(
      track.children
    );

    gsap.fromTo(
      track.children,
      {
        opacity: 0,

        x: 24,

        scale: 0.97,
      },
      {
        opacity: 1,

        x: 0,

        scale: 1,

        stagger: 0.055,

        duration: 0.48,

        ease:
          "power3.out",
      }
    );
  }, [
    gender,
    sort,
  ]);

  /* =======================================================
     ARROWS
  ======================================================= */

  function scrollProducts(
    direction:
      | "left"
      | "right"
  ) {
    trackRef.current?.scrollBy({
      left:
        direction ===
        "right"
          ? 600
          : -600,

      behavior:
        "smooth",
    });
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main
      ref={
        rootRef
      }
      className="
        min-h-screen
        bg-white
        text-[#211A18]
      "
    >
      {/* =================================================
          BANNER
      ================================================= */}

      {bannerUrl && (
        <section
          className="
            relative

            w-full

            overflow-hidden

            bg-[#F1ECE5]
          "
        >
          <div
            className="
              relative

              aspect-[16/6]

              w-full

              sm:aspect-[16/5.5]

              md:aspect-[16/5]

              lg:aspect-[1920/520]
            "
          >
            <img
              src={
                bannerUrl
              }
              alt={
                categoryName
              }
              className="
                absolute
                inset-0

                h-full
                w-full

                object-cover
                object-center
              "
            />
          </div>
        </section>
      )}

      {/* =================================================
          NEW ARRIVALS
      ================================================= */}

      <section
        className="
          mx-auto

          w-full
          max-w-[1350px]

          px-4
          pb-20
          pt-12

          md:px-8
          md:pt-16
        "
      >
        {/* HEADER */}

        <div
          ref={
            headingRef
          }
          className="
            mb-6

            flex
            flex-col
            gap-6

            border-b
            border-black/[0.08]

            pb-6

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

                tracking-[0.22em]

                text-[#B41443]
              "
            >
              New Launch
            </p>

            <div
              className="
                mt-2

                flex
                flex-wrap
                items-end
                gap-3
              "
            >
              <h1
                className="
                  text-[38px]
                  font-semibold
                  uppercase

                  leading-none

                  tracking-[-0.04em]

                  md:text-[52px]
                "
              >
                New{" "}

                <span
                  className="
                    font-light
                    text-black/60
                  "
                >
                  Arrivals
                </span>
              </h1>

              <span
                className="
                  mb-1

                  text-[10px]
                  text-black/40
                "
              >
                {
                  sortedProducts.length
                }{" "}
                {sortedProducts.length ===
                1
                  ? "product"
                  : "products"}
              </span>
            </div>
          </div>

          {/* =================================================
              MEN / WOMEN
          ================================================= */}

          <div
            className="
              flex

              w-full
              max-w-[310px]

              rounded-[13px]

              border
              border-black/20

              bg-white

              p-2
            "
          >
            <button
              type="button"
              onClick={() =>
                changeGender(
                  "men"
                )
              }
              className={`
                flex-1

                rounded-[8px]

                py-3

                text-[14px]
                font-medium

                transition-all

                ${
                  gender ===
                  "men"
                    ? "bg-[#292726] text-white shadow-sm"
                    : "text-[#403B38]"
                }
              `}
            >
              Men{" "}

              {menCount >
                0 && (
                <span
                  className="
                    ml-1
                    text-[10px]
                    opacity-60
                  "
                >
                  ({menCount})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                changeGender(
                  "women"
                )
              }
              className={`
                flex-1

                rounded-[8px]

                py-3

                text-[14px]
                font-medium

                transition-all

                ${
                  gender ===
                  "women"
                    ? "bg-[#292726] text-white shadow-sm"
                    : "text-[#403B38]"
                }
              `}
            >
              Women{" "}

              {womenCount >
                0 && (
                <span
                  className="
                    ml-1
                    text-[10px]
                    opacity-60
                  "
                >
                  ({womenCount})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div
          className="
            mb-5

            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div
            className="
              flex
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                scrollProducts(
                  "left"
                )
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-[7px]

                bg-[#292726]

                text-xl
                text-white

                transition

                hover:bg-[#B41443]
              "
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() =>
                scrollProducts(
                  "right"
                )
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-[7px]

                bg-[#292726]

                text-xl
                text-white

                transition

                hover:bg-[#B41443]
              "
            >
              ›
            </button>
          </div>

          {genderProducts.length >
            0 && (
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

                rounded-full

                border
                border-black/10

                bg-white

                px-5

                text-[10px]

                outline-none

                focus:border-[#B41443]
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
          )}
        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {sortedProducts.length >
        0 ? (
          <div
            ref={
              trackRef
            }
            className="
              flex

              gap-4

              overflow-x-auto

              pb-5

              scroll-smooth

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
            "
          >
            {sortedProducts.map(
              (
                product
              ) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                />
              )
            )}
          </div>
        ) : (
          <div
            className="
              flex

              min-h-[300px]

              flex-col

              items-center
              justify-center

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

                bg-[#B41443]/[0.06]

                text-xl
                text-[#B41443]
              "
            >
              ✦
            </div>

            <h2
              className="
                mt-5

                text-[20px]
                font-semibold
              "
            >
              {gender ===
              "men"
                ? "Men's"
                : "Women's"}{" "}
              new launches coming soon
            </h2>

            <p
              className="
                mt-2

                text-[10px]
                text-black/40
              "
            >
              New Launch products will appear here automatically.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}