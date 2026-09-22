"use client";

import {
  useSearchParams,
} from "next/navigation";

import BannerForm from "@/components/Admin/BannerForm";

export default function NewBannerPage() {
  const searchParams =
    useSearchParams();

  return (
    <BannerForm
      mode="create"
      initialPosition={
        searchParams.get(
          "position"
        )
      }
    />
  );
}
