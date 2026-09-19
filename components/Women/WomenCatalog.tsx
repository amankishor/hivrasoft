"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { gsap } from "gsap";

import {
  ScrollTrigger,
} from "gsap/ScrollTrigger";

import {
  womenMenu,
  getWomenMenuItem,
  getWomenPageTitle,
  type WomenBanner,
  type WomenProduct,
} from "@/data/women";


/* =========================================================
   TYPES
========================================================= */

type WomenCatalogProps = {
  products: WomenProduct[];

  banners: WomenBanner[];

  title: string;

  description: string;

  category?: string;

  subcategory?: string;
};


/* =========================================================
   PAGE BANNER SLIDER

   REQUIRED IMAGE SIZE:
   1600 x 558
========================================================= */

function WomenBannerSlider({
  banners,
}: {
  banners: WomenBanner[];
}) {
  const [
    active,
    setActive,
  ] = useState(0);


  useEffect(() => {
    /*
     * Route change hone par
     * first banner se start karo.
     */

    setActive(0);


    if (
      banners.length <= 1
    ) {
      return;
    }


    const timer =
      window.setInterval(() => {
        setActive(
          (current) =>
            (current + 1) %
            banners.length
        );
      }, 3500);


    return () => {
      window.clearInterval(timer);
    };
  }, [banners]);


  if (!banners.length) {
    return null;
  }


  const previous = () => {
    setActive((current) =>
      current === 0
        ? banners.length - 1
        : current - 1
    );
  };


  const next = () => {
    setActive(
      (current) =>
        (current + 1) %
        banners.length
    );
  };


  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#EFE6DC]
      "
      style={{
        aspectRatio:
          "1600 / 558",
      }}
    >
      {/* BANNERS */}

      {banners.map(
        (
          banner,
          index
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect
            }
            aria-label={
              banner.alt
            }
            className={`
              absolute
              inset-0
              block
              h-full
              w-full
              transition-transform
              duration-1000
              ease-[cubic-bezier(.22,1,.36,1)]

              ${
                active === index
                  ? "translate-x-0"
                  : index < active
                    ? "-translate-x-full"
                    : "translate-x-full"
              }
            `}
          >
            <img
              src={
                banner.image
              }
              alt={
                banner.alt
              }
              className="
                block
                h-full
                w-full
                object-cover
                object-center
              "
            />
          </Link>
        )
      )}


      {/* LEFT */}

      {banners.length > 1 && (
        <button
          type="button"
          aria-label="Previous banner"
          onClick={previous}
          className="
            absolute
            left-3
            top-1/2
            z-30
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/85
            text-[22px]
            text-[#211A18]
            shadow-lg
            backdrop-blur
            transition
            hover:scale-110
            sm:left-5
            sm:h-11
            sm:w-11
            sm:text-2xl
          "
        >
          ‹
        </button>
      )}


      {/* RIGHT */}

      {banners.length > 1 && (
        <button
          type="button"
          aria-label="Next banner"
          onClick={next}
          className="
            absolute
            right-3
            top-1/2
            z-30
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/85
            text-[22px]
            text-[#211A18]
            shadow-lg
            backdrop-blur
            transition
            hover:scale-110
            sm:right-5
            sm:h-11
            sm:w-11
            sm:text-2xl
          "
        >
          ›
        </button>
      )}


      {/* DOTS */}

      {banners.length > 1 && (
        <div
          className="
            absolute
            bottom-3
            left-1/2
            z-30
            flex
            -translate-x-1/2
            items-center
            gap-2
            sm:bottom-5
          "
        >
          {banners.map(
            (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Banner ${index + 1}`}
                onClick={() =>
                  setActive(
                    index
                  )
                }
                className={`
                  h-[6px]
                  rounded-full
                  shadow-sm
                  transition-all
                  duration-300

                  ${
                    active ===
                    index
                      ? "w-8 bg-[#8C1839]"
                      : "w-[6px] bg-white/90"
                  }
                `}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
}: {
  product: WomenProduct;
}) {
  const [
    hovered,
    setHovered,
  ] = useState(false);

  const [
    clicked,
    setClicked,
  ] = useState(false);


  const showSecond =
    hovered || clicked;


  const productUrl =
    `/product/${product.slug}/`;


  const discount =
    product.actualPrice >
    product.discountedPrice
      ? Math.round(
          ((product.actualPrice -
            product.discountedPrice) /
            product.actualPrice) *
            100
        )
      : 0;


  return (
    <article
      data-product-card
      className="
        group
        overflow-hidden
        rounded-[18px]
        border
        border-[#211A18]/10
        bg-white
        shadow-[0_10px_35px_rgba(33,26,24,0.04)]
        transition-all
        duration-500
        hover:-translate-y-2
        hover:shadow-[0_24px_60px_rgba(33,26,24,0.12)]
      "
    >
      {/* IMAGE */}

      <div
        role="button"
        tabIndex={0}
        className="
          relative
          aspect-[4/5]
          cursor-pointer
          overflow-hidden
          bg-[#EFE6DC]
        "
        onMouseEnter={() =>
          setHovered(true)
        }
        onMouseLeave={() =>
          setHovered(false)
        }
        onClick={() =>
          setClicked(
            (value) =>
              !value
          )
        }
      >
        {/* FIRST */}

        <img
          src={
            product.image1
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
            transition-all
            duration-700

            ${
              showSecond
                ? "scale-105 opacity-0"
                : "scale-100 opacity-100"
            }
          `}
        />


        {/* SECOND */}

        <img
          src={
            product.image2 ||
            product.image1
          }
          alt={`${product.name} alternate`}
          className={`
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-all
            duration-700

            ${
              showSecond
                ? "scale-100 opacity-100"
                : "scale-105 opacity-0"
            }
          `}
        />


        {/* DISCOUNT */}

        {discount > 0 && (
          <span
            className="
              absolute
              left-3
              top-3
              z-20
              rounded-full
              bg-[#8C1839]
              px-3
              py-[6px]
              text-[8px]
              font-semibold
              text-white
            "
          >
            {discount}% OFF
          </span>
        )}


        {/* HEART */}

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
            bg-white/90
            text-[18px]
            text-[#8C1839]
          "
        >
          ♡
        </span>
      </div>


      {/* DETAILS */}

      <div className="p-4">
        <p
          className="
            mb-2
            text-[8px]
            uppercase
            tracking-[0.22em]
            text-[#9C765D]
          "
        >
          Hivra Soft
        </p>

        <Link
          href={productUrl}
          className="
            block
            min-h-[44px]
            text-[13px]
            font-medium
            leading-5
            transition
            hover:text-[#8C1839]
          "
        >
          {product.name}
        </Link>

        <div
          className="
            mt-3
            flex
            items-center
            gap-2
          "
        >
          <span
            className="
              text-[15px]
              font-bold
              text-[#8C1839]
            "
          >
            ₹
            {
              product.discountedPrice
            }
          </span>

          <span
            className="
              text-[11px]
              text-black/35
              line-through
            "
          >
            ₹
            {
              product.actualPrice
            }
          </span>
        </div>

        <Link
          href={productUrl}
          className="
            mt-4
            flex
            w-full
            items-center
            justify-center
            rounded-full
            bg-[#F2E9E2]
            px-4
            py-3
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.17em]
            transition
            hover:bg-[#211A18]
            hover:text-white
          "
        >
          View Product
        </Link>
      </div>
    </article>
  );
}


/* =========================================================
   CATEGORY NAV
========================================================= */

function CategoryNavigation({
  category,
  subcategory,
}: {
  category?: string;
  subcategory?: string;
}) {
  const activeParent =
    getWomenMenuItem(
      category
    );


  return (
    <section
      className="
        border-y
        border-[#211A18]/10
        bg-[#EFE6DC]/95
        backdrop-blur-xl
      "
    >
      {/* MAIN */}

      <div
        className="
          mx-auto
          flex
          max-w-[1450px]
          gap-3
          overflow-x-auto
          px-4
          py-4
          md:px-8
        "
      >
        <Link
          href="/women/"
          className={`
            shrink-0
            rounded-full
            px-5
            py-3
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.14em]

            ${
              !category
                ? "bg-[#211A18] text-white"
                : "bg-white text-[#211A18]"
            }
          `}
        >
          All Women
        </Link>


        {womenMenu.map(
          (item) => (
            <Link
              key={
                item.slug
              }
              href={
                item.href
              }
              className={`
                shrink-0
                rounded-full
                px-5
                py-3
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.14em]
                transition

                ${
                  category ===
                  item.slug
                    ? "bg-[#8C1839] text-white"
                    : "bg-white text-[#211A18] hover:bg-[#8C1839] hover:text-white"
                }
              `}
            >
              {
                item.name
              }
            </Link>
          )
        )}
      </div>


      {/* CHILDREN */}

      {!!activeParent
        ?.children
        .length && (
        <div
          className="
            mx-auto
            flex
            max-w-[1450px]
            gap-7
            overflow-x-auto
            px-4
            pb-5
            md:px-8
          "
        >
          <Link
            href={
              activeParent.href
            }
            className={`
              shrink-0
              border-b-2
              pb-2
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.13em]

              ${
                !subcategory
                  ? "border-[#8C1839] text-[#8C1839]"
                  : "border-transparent text-[#6F5A4C]"
              }
            `}
          >
            All{" "}
            {
              activeParent.name
            }
          </Link>


          {activeParent.children.map(
            (child) => (
              <Link
                key={
                  child.slug
                }
                href={
                  child.href
                }
                className={`
                  shrink-0
                  border-b-2
                  pb-2
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.13em]

                  ${
                    subcategory ===
                    child.slug
                      ? "border-[#8C1839] text-[#8C1839]"
                      : "border-transparent text-[#6F5A4C] hover:text-[#8C1839]"
                  }
                `}
              >
                {
                  child.name
                }
              </Link>
            )
          )}
        </div>
      )}
    </section>
  );
}


/* =========================================================
   WOMEN CATALOG
========================================================= */

export default function WomenCatalog({
  products,
  banners,
  title,
  description,
  category,
  subcategory,
}: WomenCatalogProps) {
  const rootRef =
    useRef<HTMLElement>(
      null
    );


  const [
    sort,
    setSort,
  ] = useState(
    "featured"
  );


  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const result = [
        ...products,
      ];


      if (
        sort === "low-high"
      ) {
        return result.sort(
          (a, b) =>
            a.discountedPrice -
            b.discountedPrice
        );
      }


      if (
        sort === "high-low"
      ) {
        return result.sort(
          (a, b) =>
            b.discountedPrice -
            a.discountedPrice
        );
      }


      return result;
    }, [products, sort]);


  /* =======================================================
     GSAP
  ======================================================= */

  useEffect(() => {
    gsap.registerPlugin(
      ScrollTrigger
    );


    const root =
      rootRef.current;


    if (!root) {
      return;
    }


    const ctx =
      gsap.context(() => {
        gsap.fromTo(
          "[data-women-hero]",
          {
            y: 35,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,

            duration: 0.8,

            ease:
              "power3.out",
          }
        );


        ScrollTrigger.batch(
          "[data-product-card]",
          {
            start:
              "top 92%",

            once: true,

            onEnter:
              (elements) => {
                gsap.fromTo(
                  elements,
                  {
                    y: 40,
                    opacity: 0,
                  },
                  {
                    y: 0,
                    opacity: 1,

                    duration:
                      0.7,

                    stagger:
                      0.07,

                    ease:
                      "power3.out",
                  }
                );
              },
          }
        );
      }, root);


    return () => {
      ctx.revert();
    };
  }, [products]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      ref={rootRef}
      className="
        min-h-screen
        bg-[#F7F3EF]
        text-[#211A18]
      "
    >
      {/* =============================================
          ROUTE SPECIFIC BANNER
      ============================================= */}

      <WomenBannerSlider
        banners={banners}
      />


      {/* =============================================
          HERO TEXT
      ============================================= */}

      <section
        className="
          border-b
          border-[#211A18]/10
          px-5
          py-14
          md:px-8
          md:py-20
        "
      >
        <div
          data-women-hero
          className="
            mx-auto
            max-w-[1450px]
          "
        >
          {/* BREADCRUMB */}

          <div
            className="
              mb-7
              flex
              flex-wrap
              items-center
              gap-2
              text-[8px]
              uppercase
              tracking-[0.2em]
              text-[#9C765D]
            "
          >
            <Link href="/">
              Home
            </Link>

            <span>/</span>

            <Link href="/women/">
              Women
            </Link>


            {category && (
              <>
                <span>
                  /
                </span>

                <Link
                  href={`/women/${category}/`}
                >
                  {
                    getWomenPageTitle(
                      category
                    )
                  }
                </Link>
              </>
            )}


            {subcategory && (
              <>
                <span>
                  /
                </span>

                <span
                  className="
                    text-[#211A18]
                  "
                >
                  {
                    getWomenPageTitle(
                      category,
                      subcategory
                    )
                  }
                </span>
              </>
            )}
          </div>


          <p
            className="
              mb-4
              text-[8px]
              uppercase
              tracking-[0.5em]
              text-[#9C765D]
            "
          >
            Hivra Soft Women
          </p>


          <h1
            className="
              text-[48px]
              font-medium
              leading-[0.9]
              tracking-[-0.055em]
              md:text-[76px]
              lg:text-[92px]
            "
          >
            {title}
          </h1>


          <p
            className="
              mt-6
              max-w-[620px]
              text-[13px]
              leading-7
              text-[#6F5A4C]
            "
          >
            {description}
          </p>
        </div>
      </section>


      {/* =============================================
          CATEGORY
      ============================================= */}

      <CategoryNavigation
        category={category}
        subcategory={
          subcategory
        }
      />


      {/* =============================================
          PRODUCTS
      ============================================= */}

      <section
        className="
          px-4
          py-14
          md:px-8
          md:py-20
        "
      >
        <div
          className="
            mx-auto
            max-w-[1450px]
          "
        >
          {/* TOOLBAR */}

          <div
            className="
              mb-8
              flex
              flex-col
              gap-4
              border-b
              border-[#211A18]/10
              pb-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                text-[9px]
                uppercase
                tracking-[0.2em]
                text-[#8C6A52]
              "
            >
              {
                sortedProducts.length
              }{" "}
              Products
            </p>


            <select
              value={sort}
              onChange={(
                event
              ) =>
                setSort(
                  event.target
                    .value
                )
              }
              className="
                border
                border-[#211A18]/15
                bg-[#F7F3EF]
                px-4
                py-3
                text-[9px]
                uppercase
                tracking-[0.1em]
                outline-none
              "
            >
              <option
                value="featured"
              >
                Featured
              </option>

              <option
                value="low-high"
              >
                Price Low to
                High
              </option>

              <option
                value="high-low"
              >
                Price High to
                Low
              </option>
            </select>
          </div>


          {/* GRID */}

          {sortedProducts.length >
          0 ? (
            <div
              className="
                grid
                grid-cols-2
                gap-4
                md:grid-cols-3
                lg:grid-cols-4
              "
            >
              {sortedProducts.map(
                (product) => (
                  <ProductCard
                    key={
                      product.slug
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
                min-h-[380px]
                items-center
                justify-center
                text-center
              "
            >
              <div>
                <p
                  className="
                    text-[8px]
                    uppercase
                    tracking-[0.35em]
                    text-[#9C765D]
                  "
                >
                  Hivra Soft
                </p>

                <h2
                  className="
                    mt-4
                    text-[32px]
                    font-medium
                  "
                >
                  Products coming
                  soon.
                </h2>

                <Link
                  href="/women/"
                  className="
                    mt-7
                    inline-flex
                    rounded-full
                    bg-[#211A18]
                    px-7
                    py-3
                    text-[8px]
                    uppercase
                    tracking-[0.17em]
                    text-white
                  "
                >
                  View All Women
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}