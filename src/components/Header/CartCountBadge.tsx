"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCartCount,
} from "@/src/services/cart";

export default function CartCountBadge() {
  const [
    count,
    setCount,
  ] =
    useState(0);

  const refresh =
    useCallback(
      async () => {
        setCount(
          await getCartCount()
        );
      },
      []
    );

  useEffect(() => {
    void refresh();

    window.addEventListener(
      "hivrasoft-cart-updated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        refresh
      );
    };
  }, [
    refresh,
  ]);

  if (
    count <= 0
  ) {
    return null;
  }

  return (
    <span
      className="
        absolute
        -right-1
        -top-1

        flex
        h-[18px]
        min-w-[18px]
        items-center
        justify-center

        rounded-full

        bg-[#A91543]

        px-1

        text-[8px]
        font-bold
        text-white
      "
    >
      {
        count > 99
          ? "99+"
          : count
      }
    </span>
  );
}