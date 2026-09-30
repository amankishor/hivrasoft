"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  addPendingWishlistProduct,
  addProductToWishlist,
  checkLoggedIn,
  checkProductWishlist,
  isPendingWishlistProduct,
  notifyWishlistUpdated,
  removePendingWishlistProduct,
  removeProductFromWishlist,
  requestStoreLogin,
} from "@/src/services/storeActions";

type WishlistButtonProps = {
  productId: string;

  className?: string;

  showToast?: boolean;
};

export default function WishlistButton({
  productId,
  className = "",
  showToast = true,
}: WishlistButtonProps) {
  const [
    wishlisted,
    setWishlisted,
  ] =
    useState(false);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState(false);

  /* =======================================================
     CURRENT STATE

     Logged in =>
     backend wishlist

     Guest =>
     sessionStorage
  ======================================================= */

  const refresh =
    useCallback(
      async () => {
        if (
          !productId
        ) {
          return;
        }

        const loggedIn =
          await checkLoggedIn();

        if (
          loggedIn
        ) {
          const exists =
            await checkProductWishlist(
              productId
            );

          setWishlisted(
            exists
          );

          return;
        }

        setWishlisted(
          isPendingWishlistProduct(
            productId
          )
        );
      },
      [
        productId,
      ]
    );

  useEffect(() => {
    void refresh();

    const update = () => {
      void refresh();
    };

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      update
    );

    window.addEventListener(
      "hivrasoft-pending-wishlist-updated",
      update
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        update
      );

      window.removeEventListener(
        "hivrasoft-pending-wishlist-updated",
        update
      );
    };
  }, [
    refresh,
  ]);

  /* =======================================================
     MESSAGE TIMER
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

          setError(
            false
          );
        },
        2600
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    message,
  ]);

  /* =======================================================
     TOGGLE
  ======================================================= */

  async function toggle(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      busy ||
      !productId
    ) {
      return;
    }

    try {
      setBusy(
        true
      );

      const loggedIn =
        await checkLoggedIn();

      /* ===================================================
         GUEST USER
      =================================================== */

      if (
        !loggedIn
      ) {
        if (
          wishlisted
        ) {
          removePendingWishlistProduct(
            productId
          );

          setWishlisted(
            false
          );

          setMessage(
            "Removed from temporary wishlist."
          );

          setError(
            false
          );

          return;
        }

        /*
         * Guest click =>
         * temporarily save.
         */

        addPendingWishlistProduct(
          productId
        );

        setWishlisted(
          true
        );

        setMessage(
          "Saved temporarily. Log in to save it to your wishlist."
        );

        setError(
          false
        );

        /*
         * Login modal bhi open karo.
         */

        requestStoreLogin();

        return;
      }

      /* ===================================================
         LOGGED-IN USER
      =================================================== */

      if (
        wishlisted
      ) {
        await removeProductFromWishlist(
          productId
        );

        setWishlisted(
          false
        );

        setMessage(
          "Removed from wishlist."
        );
      } else {
        await addProductToWishlist(
          productId
        );

        setWishlisted(
          true
        );

        setMessage(
          "Added to wishlist."
        );
      }

      setError(
        false
      );

      notifyWishlistUpdated();
    } catch (
      actionError
    ) {
      const text =
        actionError instanceof
          Error
          ? actionError.message
          : "Wishlist update failed.";

      /*
       * Login expired during request.
       * Product ko temporary wishlist
       * me lose nahi karenge.
       */

      if (
        text ===
        "Please log in first."
      ) {
        addPendingWishlistProduct(
          productId
        );

        setWishlisted(
          true
        );

        setMessage(
          "Saved temporarily. Please log in first."
        );

        requestStoreLogin();

        return;
      }

      setMessage(
        text
      );

      setError(
        true
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={
          busy
        }
        onClick={
          toggle
        }
        aria-label={
          wishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        title={
          wishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        className={`
          flex
          h-10
          w-10
          items-center
          justify-center

          rounded-full

          border

          text-[19px]

          shadow-sm

          transition-all
          duration-200

          ${
            wishlisted
              ? "border-[#A91543] bg-[#A91543] text-white"
              : "border-black/5 bg-white/95 text-[#A91543] hover:scale-105 hover:bg-[#FFF2F5]"
          }

          ${
            busy
              ? "cursor-wait opacity-60"
              : ""
          }

          ${className}
        `}
      >
        {busy ? (
          <span
            className="
              h-4
              w-4
              animate-spin
              rounded-full
              border-2
              border-current
              border-t-transparent
            "
          />
        ) : wishlisted ? (
          "♥"
        ) : (
          "♡"
        )}
      </button>

      {showToast &&
        message && (
          <div
            className={`
              fixed
              right-5
              top-[105px]
              z-[9999]

              max-w-[340px]

              rounded-xl

              border

              px-5
              py-3

              text-[10px]
              font-medium

              shadow-xl

              ${
                error
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-green-200 bg-white text-[#211A18]"
              }
            `}
          >
            {
              message
            }
          </div>
        )}
    </>
  );
}