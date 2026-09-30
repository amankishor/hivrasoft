"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  checkLoggedIn,
  getCartCount,
  requestStoreLogin,
} from "@/src/services/storeActions";

type Props = {
  mobile?: boolean;
  close?: () => void;
};

export default function StoreHeaderActions({
  mobile = false,
  close,
}: Props) {
  const router =
    useRouter();

  const [
    cartCount,
    setCartCount,
  ] =
    useState(0);

  const [
    message,
    setMessage,
  ] =
    useState("");

  /* =======================================================
     COUNT
  ======================================================= */

  const refreshCart =
    useCallback(
      async () => {
        const loggedIn =
          await checkLoggedIn();

        if (
          !loggedIn
        ) {
          setCartCount(
            0
          );

          return;
        }

        setCartCount(
          await getCartCount()
        );
      },
      []
    );

  useEffect(() => {
    void refreshCart();

    window.addEventListener(
      "hivrasoft-cart-updated",
      refreshCart
    );

    window.addEventListener(
      "focus",
      refreshCart
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        refreshCart
      );

      window.removeEventListener(
        "focus",
        refreshCart
      );
    };
  }, [
    refreshCart,
  ]);

  /* =======================================================
     MESSAGE
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
        2500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    message,
  ]);

  /* =======================================================
     PROTECTED NAVIGATION
  ======================================================= */

  async function openProtected(
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

    close?.();

    router.push(
      path
    );
  }

  /* =======================================================
     MOBILE
  ======================================================= */

  if (
    mobile
  ) {
    return (
      <>
        {/* WISHLIST */}

        <button
          type="button"
          onClick={() =>
            void openProtected(
              "/wishlist/"
            )
          }
          aria-label="Wishlist"
          title="Wishlist"
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

            transition

            hover:border-[#8C1839]
            hover:text-[#8C1839]
          "
        >
          <HeartIcon />
        </button>

        {/* CART */}

        <button
          type="button"
          onClick={() =>
            void openProtected(
              "/cart/"
            )
          }
          aria-label="Cart"
          title="Cart"
          className="
            relative

            flex
            h-12
            items-center
            justify-center

            rounded-md

            bg-[#211A18]

            text-white

            transition

            hover:bg-[#8C1839]
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

        <Toast
          message={
            message
          }
        />
      </>
    );
  }

  /* =======================================================
     DESKTOP
  ======================================================= */

  return (
    <>
      {/* WISHLIST */}

      <button
        type="button"
        onClick={() =>
          void openProtected(
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

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#8C1839]
          focus-visible:ring-offset-2
        "
      >
        <HeartIcon />
      </button>

      {/* CART */}

      <button
        type="button"
        onClick={() =>
          void openProtected(
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
          duration-300

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

      <Toast
        message={
          message
        }
      />
    </>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({
  message,
}: {
  message: string;
}) {
  if (
    !message
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed
        right-5
        top-[105px]
        z-[9999]

        rounded-xl

        bg-[#211A18]

        px-5
        py-3

        text-[10px]
        font-medium
        text-white

        shadow-xl
      "
    >
      {
        message
      }
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

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