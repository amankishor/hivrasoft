"use client";

import Image from "next/image";
import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Account from "../Auth/Account";

import {
  checkLoggedIn,
  getCartCount,
  getPendingWishlistIds,
  requestStoreLogin,
  syncPendingWishlist,
} from "@/src/Services/storeActions";

/* =========================================================
   WOMEN
========================================================= */

const braLinks = [
  {
    name: "Sports Bra",
    href: "/women/bra/sports-bra/",
  },
  {
    name: "Maternity Bra",
    href: "/women/bra/maternity-bra/",
  },
  {
    name: "T-Shirt Bra",
    href: "/women/bra/t-shirt-bra/",
  },
  {
    name: "Padded Bra",
    href: "/women/bra/padded-bra/",
  },
  {
    name: "Non Padded Bra",
    href: "/women/bra/non-padded-bra/",
  },
];

const pantyLinks = [
  {
    name: "Seamless Panty",
    href: "/women/panty/seamless-panty/",
  },
  {
    name: "Hipster",
    href: "/women/panty/hipster/",
  },
  {
    name: "Thongs",
    href: "/women/panty/thongs/",
  },
  {
    name: "G-String",
    href: "/women/panty/g-string/",
  },
];

const discoverLinks = [
  {
    name: "Lingerie",
    href: "/women/lingerie/",
  },
  {
    name: "Shop By Body Shape",
    href: "/women/shop-by-body-shape/",
  },
  {
    name: "Women Offers",
    href: "/women/offers/",
  },
  {
    name: "View All",
    href: "/women/",
  },
];

/* =========================================================
   MEN
========================================================= */

const menLinks = [
  {
    name: "Trunks",
    href: "/men/trunks/",
  },
  {
    name: "Briefs",
    href: "/men/briefs/",
  },
  {
    name: "Men Thongs",
    href: "/men/thongs/",
  },
  {
    name: "G-Strings",
    href: "/men/g-strings/",
  },
  {
    name: "Men Offers",
    href: "/men/offers/",
  },
];

/* =========================================================
   HEADER
========================================================= */

export default function Header() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    mobileWomenOpen,
    setMobileWomenOpen,
  ] =
    useState(false);

  const [
    mobileMenOpen,
    setMobileMenOpen,
  ] =
    useState(false);

  const [
    cartCount,
    setCartCount,
  ] =
    useState(0);

  const [
    pendingWishlist,
    setPendingWishlist,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const syncRunning =
    useRef(false);

  /* =======================================================
     TEMP WISHLIST FLAG
  ======================================================= */

  const refreshPendingState =
    useCallback(() => {
      setPendingWishlist(
        getPendingWishlistIds()
          .length > 0
      );
    }, []);

  /* =======================================================
     HEADER AUTH REFRESH
  ======================================================= */

  const refreshHeaderState =
    useCallback(
      async () => {
        if (
          syncRunning.current
        ) {
          return;
        }

        syncRunning.current =
          true;

        try {
          const loggedIn =
            await checkLoggedIn();

          if (
            !loggedIn
          ) {
            setCartCount(
              0
            );

            refreshPendingState();

            return;
          }

          /*
           * USER JUST LOGGED IN:
           *
           * sessionStorage wishlist
           * automatically backend me sync.
           */

          const sync =
            await syncPendingWishlist();

          refreshPendingState();

          if (
            sync.synced >
            0
          ) {
            setMessage(
              `${sync.synced} saved ${
                sync.synced ===
                1
                  ? "item"
                  : "items"
              } added to your wishlist.`
            );
          }

          const count =
            await getCartCount();

          setCartCount(
            count
          );
        } finally {
          syncRunning.current =
            false;
        }
      },
      [
        refreshPendingState,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    refreshPendingState();

    void refreshHeaderState();
  }, [
    refreshHeaderState,
    refreshPendingState,
  ]);

  /* =======================================================
     GLOBAL EVENTS
  ======================================================= */

  useEffect(() => {
    const refresh = () => {
      refreshPendingState();

      void refreshHeaderState();
    };

    window.addEventListener(
      "hivrasoft-cart-updated",
      refresh
    );

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      refresh
    );

    window.addEventListener(
      "hivrasoft-pending-wishlist-updated",
      refresh
    );

    window.addEventListener(
      "hivrasoft-auth-changed",
      refresh
    );

    window.addEventListener(
      "focus",
      refresh
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        refresh
      );

      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        refresh
      );

      window.removeEventListener(
        "hivrasoft-pending-wishlist-updated",
        refresh
      );

      window.removeEventListener(
        "hivrasoft-auth-changed",
        refresh
      );

      window.removeEventListener(
        "focus",
        refresh
      );
    };
  }, [
    refreshHeaderState,
    refreshPendingState,
  ]);

  /* =======================================================
     LOGIN POLLING ONLY WHEN GUEST WISHLIST EXISTS

     Login modal same page par open ho sakta hai.
     Isliye pending product hone par hi short polling.

     Login detect hote hi sync ho jayega.
  ======================================================= */

  useEffect(() => {
    if (
      !pendingWishlist
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          void refreshHeaderState();
        },
        1500
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    pendingWishlist,
    refreshHeaderState,
  ]);

  /* =======================================================
     TOAST
  ======================================================= */

  useEffect(() => {
    if (
      !message
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setMessage(
            ""
          );
        },
        3000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    message,
  ]);

  /* =======================================================
     PROTECTED HEADER PAGE

     Cart + Wishlist page logged-in only.
  ======================================================= */

  async function openProtectedPage(
    path: string
  ) {
    const loggedIn =
      await checkLoggedIn();

    if (
      !loggedIn
    ) {
      setMessage(
        "Please log in first."
      );

      requestStoreLogin();

      return;
    }

    /*
     * Wishlist kholne se pehle
     * temporary products sync.
     */

    if (
      path.startsWith(
        "/wishlist"
      )
    ) {
      await syncPendingWishlist();
    }

    router.push(
      path
    );
  }

  /* =======================================================
     LANDING
  ======================================================= */

  if (
    pathname ===
    "/landing"
  ) {
    return null;
  }

  return (
    <>
      {/* TOP BAR */}

      <div
        className="
          relative
          z-[110]
          bg-[#211A18]
          px-4
          py-[7px]
          text-center
        "
      >
        <p
          className="
            text-[8px]
            font-medium
            uppercase
            tracking-[0.2em]
            text-[#F7F3EF]

            md:text-[9px]
          "
        >
          Free Shipping

          <span
            className="
              mx-3
              text-[#B9915C]
            "
          >
            •
          </span>

          Discreet Packaging

          <span
            className="
              mx-3
              text-[#B9915C]
            "
          >
            •
          </span>

          Easy Returns
        </p>
      </div>

      {/* HEADER */}

      <header
        className="
          sticky
          top-0
          z-[100]

          w-full

          border-b
          border-[#211A18]/10

          bg-[#F7F3EF]
        "
      >
        <div
          className="
            mx-auto

            flex
            h-[74px]
            max-w-[1600px]
            items-center
            justify-between

            px-4

            md:px-6
            xl:px-8
          "
        >
          {/* LOGO */}

          <Link
            href="/"
            aria-label="HivraSoft Home"
            className="
              flex
              shrink-0
              items-center
            "
          >
            <Image
              src="/images/logos/hivra-soft-logo.png"
              alt="HivraSoft"
              width={150}
              height={58}
              priority
              className="
                h-auto
                w-[120px]
                object-contain

                xl:w-[145px]
              "
            />
          </Link>

          {/* DESKTOP NAV */}

          <nav
            className="
              hidden
              h-full
              items-center
              gap-[22px]

              xl:flex
            "
          >
            <NavLink href="/bundle-pricing/">
              Bundle Pricing
            </NavLink>

            <NavLink href="/new-launch/">
              New Launch
            </NavLink>

            <NavLink href="/buy-3-get-1-free/">
              Buy 3 Get 1 Free
            </NavLink>

            {/* WOMEN */}

            <div
              className="
                group
                relative
                flex
                h-full
                items-center
              "
            >
              <Link
                href="/women/"
                className="
                  flex
                  h-full
                  items-center
                  gap-[5px]

                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#8C1839]
                "
              >
                Women

                <ChevronDown />
              </Link>

              <div
                className="
                  invisible
                  absolute
                  left-1/2
                  top-full

                  w-[650px]

                  -translate-x-1/2
                  translate-y-[8px]

                  border
                  border-[#211A18]/5

                  bg-[#F7F3EF]

                  opacity-0

                  shadow-[0_24px_60px_rgba(33,26,24,0.16)]

                  transition-all
                  duration-300

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                <div
                  className="
                    grid
                    grid-cols-3
                    gap-10
                    px-9
                    pb-9
                    pt-9
                  "
                >
                  <MenuColumn
                    title="Bras"
                    titleHref="/women/bra/"
                    links={
                      braLinks
                    }
                  />

                  <MenuColumn
                    title="Panties"
                    titleHref="/women/panty/"
                    links={
                      pantyLinks
                    }
                  />

                  <div>
                    <p
                      className="
                        mb-5
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.35em]
                        text-[#8C1839]
                      "
                    >
                      Discover
                    </p>

                    <div className="space-y-[17px]">
                      {discoverLinks.map(
                        (
                          item
                        ) => (
                          <DropdownLink
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                          >
                            {
                              item.name
                            }
                          </DropdownLink>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="
                    border-t
                    border-[#211A18]/10
                    px-9
                    py-5
                  "
                >
                  <Link
                    href="/women/"
                    className="
                      inline-flex
                      items-center
                      gap-3

                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.32em]
                      text-[#8C1839]

                      transition

                      hover:gap-5
                      hover:text-[#211A18]
                    "
                  >
                    Explore all Women&apos;s Collection

                    <span>
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* MEN */}

            <div
              className="
                group
                relative
                flex
                h-full
                items-center
              "
            >
              <Link
                href="/men/"
                className="
                  flex
                  h-full
                  items-center
                  gap-[5px]

                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]

                  transition

                  hover:text-[#8C1839]
                "
              >
                Men

                <ChevronDown />
              </Link>

              <div
                className="
                  invisible
                  absolute
                  left-1/2
                  top-full

                  w-[230px]

                  -translate-x-1/2
                  translate-y-2

                  border
                  border-[#211A18]/10

                  bg-[#F7F3EF]

                  p-4

                  opacity-0

                  shadow-[0_20px_50px_rgba(33,26,24,0.12)]

                  transition-all
                  duration-300

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                {menLinks.map(
                  (
                    item
                  ) => (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className="
                        block
                        px-4
                        py-3

                        text-[11px]
                        text-[#211A18]/65

                        transition

                        hover:bg-[#EFE6DC]
                        hover:text-[#8C1839]
                      "
                    >
                      {
                        item.name
                      }
                    </Link>
                  )
                )}
              </div>
            </div>

            <NavLink href="/accessories/">
              Accessories
            </NavLink>

            {/* MORE */}

            <div
              className="
                group
                relative
                flex
                h-full
                items-center
              "
            >
              <button
                type="button"
                className="
                  flex
                  h-full
                  items-center
                  gap-[5px]

                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]

                  transition

                  hover:text-[#8C1839]
                "
              >
                More

                <ChevronDown />
              </button>

              <div
                className="
                  invisible
                  absolute
                  right-0
                  top-full

                  w-[240px]

                  translate-y-2

                  border
                  border-[#211A18]/10

                  bg-[#F7F3EF]

                  p-4

                  opacity-0

                  shadow-[0_20px_50px_rgba(33,26,24,0.12)]

                  transition-all

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                <Link
                  href="/send-your-bra/"
                  className="
                    block
                    px-4
                    py-3
                    text-[11px]
                    text-[#211A18]/65
                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Send Your Bra
                </Link>

                <Link
                  href="/reseller-registration/"
                  className="
                    block
                    px-4
                    py-3
                    text-[11px]
                    text-[#211A18]/65
                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Reseller Registration
                </Link>
              </div>
            </div>
          </nav>

          {/* DESKTOP ICONS */}

          <div
            className="
              hidden
              items-center
              gap-1
              text-[#211A18]

              md:flex
            "
          >
            {/* SEARCH */}

            <IconLink
              href="/search/"
              label="Search"
            >
              <SearchIcon />
            </IconLink>

            {/* WISHLIST */}

            <button
              type="button"
              onClick={() =>
                void openProtectedPage(
                  "/wishlist/"
                )
              }
              aria-label="Wishlist"
              title="Wishlist"
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center

                rounded-full

                text-[#8C1839]

                transition-all
                duration-300

                hover:bg-[#EFE6DC]
              "
            >
              <HeartIcon />

              {pendingWishlist && (
                <span
                  className="
                    absolute
                    h-[6px]
                    w-[6px]
                    translate-x-[8px]
                    -translate-y-[9px]
                    rounded-full
                    bg-[#8C1839]
                  "
                />
              )}
            </button>

            {/* ACCOUNT */}

            <Account />

            {/* CART */}

            <button
              type="button"
              onClick={() =>
                void openProtectedPage(
                  "/cart/"
                )
              }
              aria-label="Cart"
              title="Cart"
              className="
                relative
                ml-1

                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center

                rounded-full

                bg-[#211A18]

                text-white

                shadow-sm

                transition-all

                hover:bg-[#8C1839]
              "
            >
              <BagIcon />

              {cartCount >
                0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1

                    flex
                    h-[17px]
                    min-w-[17px]
                    items-center
                    justify-center

                    rounded-full

                    bg-[#8C1839]

                    px-1

                    text-[8px]
                    font-bold
                    text-white
                  "
                >
                  {cartCount >
                  99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            aria-label="Menu"
            onClick={() =>
              setMobileOpen(
                (value) =>
                  !value
              )
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center

              rounded-full

              border
              border-[#211A18]/20

              text-[#211A18]

              xl:hidden
            "
          >
            {mobileOpen ? (
              <CloseIcon />
            ) : (
              <MenuIcon />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}

        <div
          className={`
            overflow-visible

            border-t
            border-[#211A18]/10

            bg-[#F7F3EF]

            transition-all
            duration-500

            xl:hidden

            ${
              mobileOpen
                ? "max-h-[1600px] opacity-100"
                : "max-h-0 overflow-hidden opacity-0"
            }
          `}
        >
          <div
            className="
              px-5
              py-5
            "
          >
            {/* QUICK ICONS */}

            <div
              className="
                mb-5

                grid
                grid-cols-4
                gap-2

                border-b
                border-[#211A18]/10

                pb-5
              "
            >
              <MobileIconLink
                href="/search/"
                label="Search"
                close={() =>
                  setMobileOpen(
                    false
                  )
                }
              >
                <SearchIcon />
              </MobileIconLink>

              {/* MOBILE WISHLIST */}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(
                    false
                  );

                  void openProtectedPage(
                    "/wishlist/"
                  );
                }}
                className="
                  relative

                  flex
                  h-12
                  items-center
                  justify-center

                  rounded-md

                  border
                  border-[#211A18]/15

                  bg-[#F7F3EF]

                  text-[#211A18]
                "
              >
                <HeartIcon />

                {pendingWishlist && (
                  <span
                    className="
                      absolute
                      right-2
                      top-2
                      h-[6px]
                      w-[6px]
                      rounded-full
                      bg-[#8C1839]
                    "
                  />
                )}
              </button>

              {/* ACCOUNT */}

              <Account
                mobile
                onBeforeOpen={() => {
                  setMobileOpen(
                    false
                  );

                  setMobileWomenOpen(
                    false
                  );

                  setMobileMenOpen(
                    false
                  );
                }}
              />

              {/* MOBILE CART */}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(
                    false
                  );

                  void openProtectedPage(
                    "/cart/"
                  );
                }}
                className="
                  relative

                  flex
                  h-12
                  items-center
                  justify-center

                  rounded-md

                  bg-[#211A18]

                  text-white
                "
              >
                <BagIcon />

                {cartCount >
                  0 && (
                  <span
                    className="
                      absolute
                      right-1
                      top-1

                      flex
                      h-[16px]
                      min-w-[16px]
                      items-center
                      justify-center

                      rounded-full

                      bg-[#8C1839]

                      px-1

                      text-[8px]
                      font-bold
                    "
                  >
                    {cartCount >
                    99
                      ? "99+"
                      : cartCount}
                  </span>
                )}
              </button>
            </div>

            <MobileLink
              href="/bundle-pricing/"
              close={() =>
                setMobileOpen(
                  false
                )
              }
            >
              Bundle Pricing
            </MobileLink>

            <MobileLink
              href="/new-launch/"
              close={() =>
                setMobileOpen(
                  false
                )
              }
            >
              New Launch
            </MobileLink>

            <MobileLink
              href="/buy-3-get-1-free/"
              close={() =>
                setMobileOpen(
                  false
                )
              }
            >
              Buy 3 Get 1 Free
            </MobileLink>

            {/* WOMEN */}

            <button
              type="button"
              onClick={() =>
                setMobileWomenOpen(
                  (value) =>
                    !value
                )
              }
              className="
                flex
                w-full
                items-center
                justify-between

                border-b
                border-[#211A18]/10

                py-4

                text-[12px]
                font-semibold
                uppercase
                tracking-[0.1em]
              "
            >
              Women

              <span>
                {mobileWomenOpen
                  ? "−"
                  : "+"}
              </span>
            </button>

            {mobileWomenOpen && (
              <div
                className="
                  bg-[#EFE6DC]/60
                  px-4
                  py-4
                "
              >
                <MobileSubTitle
                  href="/women/"
                  close={() =>
                    setMobileOpen(
                      false
                    )
                  }
                >
                  View All Women
                </MobileSubTitle>

                <MobileSectionTitle href="/women/bra/">
                  Bras
                </MobileSectionTitle>

                {braLinks.map(
                  (
                    item
                  ) => (
                    <MobileChildLink
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      close={() =>
                        setMobileOpen(
                          false
                        )
                      }
                    >
                      {
                        item.name
                      }
                    </MobileChildLink>
                  )
                )}

                <MobileSectionTitle href="/women/panty/">
                  Panties
                </MobileSectionTitle>

                {pantyLinks.map(
                  (
                    item
                  ) => (
                    <MobileChildLink
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      close={() =>
                        setMobileOpen(
                          false
                        )
                      }
                    >
                      {
                        item.name
                      }
                    </MobileChildLink>
                  )
                )}

                <p
                  className="
                    mt-5
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#8C1839]
                  "
                >
                  Discover
                </p>

                {discoverLinks.map(
                  (
                    item
                  ) => (
                    <MobileChildLink
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      close={() =>
                        setMobileOpen(
                          false
                        )
                      }
                    >
                      {
                        item.name
                      }
                    </MobileChildLink>
                  )
                )}
              </div>
            )}

            {/* MEN */}

            <button
              type="button"
              onClick={() =>
                setMobileMenOpen(
                  (value) =>
                    !value
                )
              }
              className="
                flex
                w-full
                items-center
                justify-between

                border-b
                border-[#211A18]/10

                py-4

                text-[12px]
                font-semibold
                uppercase
                tracking-[0.1em]
              "
            >
              Men

              <span>
                {mobileMenOpen
                  ? "−"
                  : "+"}
              </span>
            </button>

            {mobileMenOpen && (
              <div
                className="
                  bg-[#EFE6DC]/60
                  px-4
                  py-3
                "
              >
                <MobileSubTitle
                  href="/men/"
                  close={() =>
                    setMobileOpen(
                      false
                    )
                  }
                >
                  All Men
                </MobileSubTitle>

                {menLinks.map(
                  (
                    item
                  ) => (
                    <MobileChildLink
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      close={() =>
                        setMobileOpen(
                          false
                        )
                      }
                    >
                      {
                        item.name
                      }
                    </MobileChildLink>
                  )
                )}
              </div>
            )}

            <MobileLink
              href="/accessories/"
              close={() =>
                setMobileOpen(
                  false
                )
              }
            >
              Accessories
            </MobileLink>

            <MobileLink
              href="/send-your-bra/"
              close={() =>
                setMobileOpen(
                  false
                )
              }
            >
              Send Your Bra
            </MobileLink>

            <MobileLink
              href="/reseller-registration/"
              close={() =>
                setMobileOpen(
                  false
                )
              }
            >
              Reseller Registration
            </MobileLink>
          </div>
        </div>
      </header>

      {/* HEADER TOAST */}

      {message && (
        <div
          className="
            fixed
            right-5
            top-[105px]
            z-[9999]

            max-w-[350px]

            rounded-xl

            border
            border-[#211A18]/10

            bg-white

            px-5
            py-3

            text-[10px]
            font-medium
            text-[#211A18]

            shadow-[0_14px_45px_rgba(0,0,0,0.16)]
          "
        >
          {
            message
          }
        </div>
      )}
    </>
  );
}

/* =========================================================
   DESKTOP MENU HELPERS
========================================================= */

function MenuColumn({
  title,
  titleHref,
  links,
}: {
  title: string;
  titleHref: string;

  links: {
    name: string;
    href: string;
  }[];
}) {
  return (
    <div>
      <Link
        href={
          titleHref
        }
        className="
          mb-5
          inline-block

          text-[9px]
          font-semibold
          uppercase
          tracking-[0.35em]
          text-[#8C1839]

          hover:text-[#211A18]
        "
      >
        {
          title
        }
      </Link>

      <div className="space-y-[17px]">
        {links.map(
          (
            item
          ) => (
            <DropdownLink
              key={
                item.href
              }
              href={
                item.href
              }
            >
              {
                item.name
              }
            </DropdownLink>
          )
        )}
      </div>
    </div>
  );
}

function DropdownLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      className="
        block

        text-[12px]
        font-normal
        text-[#211A18]/60

        transition-all

        hover:translate-x-1
        hover:text-[#8C1839]
      "
    >
      {
        children
      }
    </Link>
  );
}

/* =========================================================
   NAV LINK
========================================================= */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      className="
        flex
        h-full
        items-center

        text-[10px]
        font-semibold
        uppercase
        tracking-[0.1em]
        text-[#211A18]

        transition

        hover:text-[#8C1839]
      "
    >
      {
        children
      }
    </Link>
  );
}

/* =========================================================
   ICON LINK
========================================================= */

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      aria-label={
        label
      }
      title={
        label
      }
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center

        rounded-full

        text-[#8C1839]

        transition-all

        hover:bg-[#EFE6DC]
      "
    >
      {
        children
      }
    </Link>
  );
}

/* =========================================================
   MOBILE
========================================================= */

function MobileLink({
  href,
  close,
  children,
}: {
  href: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      onClick={
        close
      }
      className="
        block

        border-b
        border-[#211A18]/10

        py-4

        text-[12px]
        font-semibold
        uppercase
        tracking-[0.1em]
      "
    >
      {
        children
      }
    </Link>
  );
}

function MobileIconLink({
  href,
  label,
  close,
  children,
}: {
  href: string;
  label: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      onClick={
        close
      }
      aria-label={
        label
      }
      className="
        flex
        h-12
        items-center
        justify-center

        rounded-md

        border
        border-[#211A18]/15

        bg-[#F7F3EF]

        text-[#211A18]
      "
    >
      {
        children
      }
    </Link>
  );
}

function MobileSubTitle({
  href,
  close,
  children,
}: {
  href: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      onClick={
        close
      }
      className="
        block

        border-b
        border-[#211A18]/10

        pb-4

        text-[11px]
        font-bold
        uppercase
        tracking-[0.1em]
        text-[#8C1839]
      "
    >
      {
        children
      }
    </Link>
  );
}

function MobileSectionTitle({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      className="
        mt-5
        block

        text-[10px]
        font-bold
        uppercase
        tracking-[0.2em]
        text-[#8C1839]
      "
    >
      {
        children
      }
    </Link>
  );
}

function MobileChildLink({
  href,
  close,
  children,
}: {
  href: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      onClick={
        close
      }
      className="
        ml-3
        block
        py-2

        text-[11px]
        text-[#6F5A4C]
      "
    >
      {
        children
      }
    </Link>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ChevronDown() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
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

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}