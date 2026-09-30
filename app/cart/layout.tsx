"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  checkLoggedIn,
} from "@/src/services/storeActions";

export default function CartLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [
    status,
    setStatus,
  ] =
    useState<
      | "loading"
      | "allowed"
      | "blocked"
    >("loading");

  useEffect(() => {
    void (async () => {
      const loggedIn =
        await checkLoggedIn();

      setStatus(
        loggedIn
          ? "allowed"
          : "blocked"
      );
    })();
  }, []);

  if (
    status ===
    "loading"
  ) {
    return (
      <div
        className="
          flex
          min-h-[70vh]
          items-center
          justify-center
          bg-[#F8F5F2]
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
    );
  }

  if (
    status ===
    "blocked"
  ) {
    return (
      <main
        className="
          flex
          min-h-[70vh]
          items-center
          justify-center
          bg-[#F8F5F2]
          px-5
          text-center
          text-[#211A18]
        "
      >
        <div>
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-[#F3E6E9]
              text-2xl
              text-[#9D173E]
            "
          >
            🔒
          </div>

          <h1
            className="
              mt-5
              text-2xl
              font-semibold
            "
          >
            Please log in first.
          </h1>

          <p
            className="
              mt-2
              text-[11px]
              text-black/45
            "
          >
            Login is required to
            view your shopping cart.
          </p>

          <Link
            href="/"
            className="
              mt-6
              inline-flex
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
            Go To Store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      {children}
    </>
  );
}