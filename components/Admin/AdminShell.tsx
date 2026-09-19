"use client";

import type {
  ReactNode,
} from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        min-h-screen
        bg-[#F7F3EF]
        text-[#211A18]
      "
    >
      <AdminSidebar />

      <div
        className="
          min-h-screen
          lg:pl-[260px]
        "
      >
        <AdminHeader />

        <main
          className="
            px-5
            py-7
            md:px-8
            md:py-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}