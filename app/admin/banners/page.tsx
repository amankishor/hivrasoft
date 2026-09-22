"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type BannerImage = {
  url: string;
  publicId: string;
  alt: string;
};

type BannerVideo = {
  url: string;
  publicId: string;

  poster?: {
    url: string;
    publicId: string;
  };

  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
};

type Banner = {
  _id: string;

  title: string;
  subtitle: string;
  slug: string;

  mediaType:
    | "image"
    | "video";

  images: BannerImage[];

  videos: BannerVideo[];

  linkType:
    | "none"
    | "custom"
    | "category"
    | "product"
    | "page";

  customLink: string;

  category?: {
    _id: string;
    name: string;
    slug: string;
  } | null;

  product?: {
    _id: string;
    name: string;
    slug: string;
  } | null;

  buttonText: string;

  position: string;

  device: string;

  sortOrder: number;

  isActive: boolean;

  createdAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function BannerPage() {
  const router =
    useRouter();

  const [
    banners,
    setBanners,
  ] = useState<Banner[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ======================================================
     FETCH BANNERS
  ====================================================== */

  const loadBanners =
    async () => {
      try {
        setLoading(true);

        setError("");

        const response =
          await fetch(
            `${API_URL}/api/banners`,
            {
              method: "GET",

              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.message ||
              "Failed to load banners."
          );
        }

        setBanners(
          result.data || []
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    loadBanners();
  }, []);

  /* ======================================================
     IMAGE
  ====================================================== */

  const getBannerImage = (
    banner: Banner
  ) => {
    if (
      banner.mediaType ===
        "image" &&
      banner.images?.length >
        0
    ) {
      return banner
        .images[0].url;
    }

    if (
      banner.mediaType ===
        "video" &&
      banner.videos?.length >
        0
    ) {
      return (
        banner.videos[0]
          .poster?.url || ""
      );
    }

    return "";
  };

  /* ======================================================
     LINK TEXT
  ====================================================== */

  const getLinkText = (
    banner: Banner
  ) => {
    switch (
      banner.linkType
    ) {
      case "category":
        return (
          banner.category
            ?.name ||
          "Category"
        );

      case "product":
        return (
          banner.product
            ?.name ||
          "Product"
        );

      case "custom":
        return (
          banner.customLink ||
          "Custom Link"
        );

      case "page":
        return "Page";

      default:
        return "No Link";
    }
  };

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen bg-[#f7f3ef]">
      <div className="px-8 py-8">
        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a6163c]">
              Homepage
              Management
            </p>

            <h1 className="text-3xl font-semibold text-[#17110f]">
              Banners
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage home,
              category and
              promotional
              banners.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                "/admin/banners/new"
              )
            }
            className="rounded-xl bg-[#a6163c] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#891331]"
          >
            + ADD BANNER
          </button>
        </div>

        {/* CARD */}

        <div className="overflow-hidden rounded-[24px] border border-[#e7e0da] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee7e2] px-7 py-6">
            <div>
              <h2 className="text-xl font-semibold text-[#17110f]">
                All Banners
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Homepage and
                promotional
                banner list.
              </p>
            </div>

            <div className="rounded-full bg-[#f5efeb] px-4 py-2 text-xs font-semibold text-[#a6163c]">
              {
                banners.length
              }{" "}
              BANNERS
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading
              banners...
            </div>
          )}

          {/* ERROR */}

          {!loading &&
            error && (
              <div className="p-10 text-center text-sm text-red-500">
                {error}
              </div>
            )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            banners.length ===
              0 && (
              <div className="p-14 text-center">
                <h3 className="text-lg font-semibold">
                  No banners
                  found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Create your
                  first banner.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/admin/banners/new"
                    )
                  }
                  className="mt-5 rounded-lg bg-[#17110f] px-5 py-3 text-sm font-semibold text-white"
                >
                  + NEW BANNER
                </button>
              </div>
            )}

          {/* LIST */}

          {!loading &&
            !error &&
            banners.length >
              0 && (
              <div className="space-y-3 p-5">
                {banners.map(
                  (
                    banner
                  ) => {
                    const image =
                      getBannerImage(
                        banner
                      );

                    return (
                      <div
                        key={
                          banner._id
                        }
                        className="flex items-center justify-between rounded-[18px] border border-[#ebe5df] bg-[#fdfbf9] p-4"
                      >
                        {/* LEFT */}

                        <div className="flex min-w-0 items-center gap-4">
                          {/* PREVIEW */}

                          <div className="h-[76px] w-[120px] overflow-hidden rounded-xl border bg-[#f4f0ec]">
                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={
                                  banner.title
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                NO
                                MEDIA
                              </div>
                            )}
                          </div>

                          {/* DETAILS */}

                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="truncate text-base font-semibold text-[#17110f]">
                                {
                                  banner.title
                                }
                              </h3>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  banner.isActive
                                    ? "bg-green-50 text-green-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {banner.isActive
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                              /
                              {
                                banner.slug
                              }{" "}
                              •{" "}
                              {
                                banner.mediaType
                              }{" "}
                              •{" "}
                              {
                                banner.position
                              }
                            </p>

                            <p className="mt-2 text-xs text-[#a6163c]">
                              Link:{" "}
                              {getLinkText(
                                banner
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Device:{" "}
                              {
                                banner.device
                              }{" "}
                              • Sort:{" "}
                              {
                                banner.sortOrder
                              }
                            </p>
                          </div>
                        </div>

                        {/* ACTION */}

                        <div className="ml-5 flex items-center gap-3">
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/banners/${banner._id}/edit`
                              )
                            }
                            className="rounded-lg border border-[#ddd5d0] px-5 py-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                          >
                            EDIT
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}