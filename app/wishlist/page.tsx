"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Header from "@/src/components/Header/Header";

import {
  clearWishlist,
  getWishlist,
  getWishlistProductId,
  notifyWishlistUpdated,
  removeFromWishlist,
  type WishlistImage,
  type WishlistItem,
  type WishlistProduct,
} from "@/src/services/wishlist";

/* =========================================================
   PRODUCT
========================================================= */

function productFromItem(
  item: WishlistItem
): WishlistProduct | null {
  const source =
    item.product ??
    item.productId;

  return typeof source ===
    "object"
    ? source
    : null;
}

/* =========================================================
   DEFAULT COLOR
========================================================= */

function defaultColor(
  product: WishlistProduct | null
) {
  if (
    !product?.colors?.length
  ) {
    return null;
  }

  return (
    product.colors.find(
      (color) =>
        color.isDefault
    ) ||
    product.colors[0]
  );
}

/* =========================================================
   IMAGE
========================================================= */

function imageUrl(
  image?: WishlistImage
): string {
  if (
    typeof image ===
    "string"
  ) {
    return image;
  }

  return String(
    image?.url || ""
  );
}

function getProductImage(
  product: WishlistProduct | null
) {
  const color =
    defaultColor(
      product
    );

  const colorImage =
    color?.images?.find(
      (image) =>
        typeof image !==
          "string" &&
        image.isDefault
    ) ||
    color?.images?.[0];

  return (
    imageUrl(
      colorImage
    ) ||
    imageUrl(
      product?.mainImages?.[0]
    )
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function WishlistPage() {
  const [
    items,
    setItems,
  ] =
    useState<
      WishlistItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busyId,
    setBusyId,
  ] =
    useState<
      string | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState("");

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          setItems(
            await getWishlist()
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load wishlist."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void load();
  }, [
    load,
  ]);

  async function remove(
    productId: string
  ) {
    try {
      setBusyId(
        productId
      );

      await removeFromWishlist(
        productId
      );

      setItems(
        (
          current
        ) =>
          current.filter(
            (
              item
            ) =>
              getWishlistProductId(
                item
              ) !== productId
          )
      );

      notifyWishlistUpdated();
    } catch (
      removeError
    ) {
      setError(
        removeError instanceof
          Error
          ? removeError.message
          : "Unable to remove wishlist item."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  async function clearAll() {
    if (
      !window.confirm(
        "Clear complete wishlist?"
      )
    ) {
      return;
    }

    try {
      setBusyId(
        "clear"
      );

      await clearWishlist();

      setItems(
        []
      );

      notifyWishlistUpdated();
    } catch (
      clearError
    ) {
      setError(
        clearError instanceof
          Error
          ? clearError.message
          : "Unable to clear wishlist."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen
          bg-[#F8F5F2]
          px-4
          py-10
          text-[#211A18]

          md:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1300px]
          "
        >
          <div
            className="
              flex
              items-end
              justify-between
              border-b
              border-black/10
              pb-6
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-[#9D173E]
                "
              >
                Saved For Later
              </p>

              <h1
                className="
                  mt-2
                  text-3xl
                  font-semibold
                "
              >
                My Wishlist
              </h1>

              <p
                className="
                  mt-2
                  text-[11px]
                  text-black/45
                "
              >
                {items.length}{" "}
                saved product(s)
              </p>
            </div>

            {items.length >
              0 && (
              <button
                type="button"
                onClick={
                  clearAll
                }
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#9D173E]
                "
              >
                Clear Wishlist
              </button>
            )}
          </div>

          {error && (
            <p
              className="
                mt-5
                rounded-xl
                bg-red-50
                p-4
                text-[11px]
                text-red-600
              "
            >
              {error}
            </p>
          )}

          {loading ? (
            <div
              className="
                flex
                min-h-[400px]
                items-center
                justify-center
              "
            >
              <span
                className="
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-2
                  border-black/10
                  border-t-[#9D173E]
                "
              />
            </div>
          ) : items.length ===
            0 ? (
            <div
              className="
                flex
                min-h-[430px]
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <div
                className="
                  text-4xl
                  text-[#9D173E]
                "
              >
                ♡
              </div>

              <h2
                className="
                  mt-4
                  text-2xl
                  font-semibold
                "
              >
                Your wishlist is empty
              </h2>

              <Link
                href="/men"
                className="
                  mt-6
                  rounded-full
                  bg-[#9D173E]
                  px-8
                  py-3
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white
                "
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div
              className="
                mt-8
                grid
                grid-cols-2
                gap-5

                md:grid-cols-3

                lg:grid-cols-4
              "
            >
              {items.map(
                (
                  item,
                  index
                ) => {
                  const product =
                    productFromItem(
                      item
                    );

                  const color =
                    defaultColor(
                      product
                    );

                  const productId =
                    getWishlistProductId(
                      item
                    );

                  const name =
                    color
                      ?.nameProduct ||
                    product?.nameProduct ||
                    product?.name ||
                    "Product";

                  const slug =
                    color
                      ?.slugProduct ||
                    product?.slugProduct ||
                    product?.slug ||
                    "";

                  const image =
                    getProductImage(
                      product
                    );

                  const showPrice =
                    Number(
                      color
                        ?.showPrice ??
                        product
                          ?.showPrice ??
                        product
                          ?.price ??
                        0
                    );

                  const originalPrice =
                    Number(
                      color
                        ?.originalPrice ??
                        product
                          ?.originalPrice ??
                        product
                          ?.compareAtPrice ??
                        showPrice
                    );

                  return (
                    <article
                      key={
                        productId ||
                        item._id ||
                        index
                      }
                      className="
                        group
                        min-w-0
                      "
                    >
                      <div
                        className="
                          relative
                        "
                      >
                        <Link
                          href={
                            slug
                              ? `/product/${slug}`
                              : "#"
                          }
                          className="
                            block
                            aspect-[4/5]
                            overflow-hidden
                            rounded-[14px]
                            bg-[#F2ECE7]
                          "
                        >
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                name
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                                transition
                                duration-500
                                group-hover:scale-[1.02]
                              "
                            />
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
                        </Link>

                        <button
                          type="button"
                          disabled={
                            busyId ===
                            productId
                          }
                          onClick={() =>
                            void remove(
                              productId
                            )
                          }
                          className="
                            absolute
                            right-3
                            top-3
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-[#9D173E]
                            text-lg
                            text-white
                            shadow
                            disabled:opacity-50
                          "
                        >
                          ♥
                        </button>
                      </div>

                      <Link
                        href={
                          slug
                            ? `/product/${slug}`
                            : "#"
                        }
                        className="
                          mt-3
                          block
                          truncate
                          text-[12px]
                          font-medium
                        "
                      >
                        {
                          name
                        }
                      </Link>

                      <div
                        className="
                          mt-2
                          flex
                          items-center
                          gap-2
                        "
                      >
                        {showPrice >
                          0 && (
                          <strong
                            className="
                              text-[13px]
                            "
                          >
                            ₹
                            {showPrice.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </strong>
                        )}

                        {originalPrice >
                          showPrice &&
                          showPrice >
                            0 && (
                            <span
                              className="
                                text-[10px]
                                text-black/35
                                line-through
                              "
                            >
                              ₹
                              {originalPrice.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}