"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
};

type BannerImage = {
  url: string;
  publicId: string;
  alt: string;
};

type BannerVideo = {
  url: string;
  publicId: string;

  poster: {
    url: string;
    publicId: string;
  };

  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
};

export default function AddBannerPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    categories,
    setCategories,
  ] = useState<Category[]>(
    []
  );

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    []
  );

  /* ======================================================
     FORM
  ====================================================== */

  const [
    form,
    setForm,
  ] = useState({
    title: "",

    subtitle: "",

    slug: "",

    description: "",

    mediaType:
      "image",

    linkType:
      "none",

    customLink: "",

    category: "",

    product: "",

    page: "",

    buttonText:
      "Shop Now",

    openInNewTab:
      false,

    position:
      "home_hero",

    device:
      "all",

    sortOrder: 0,

    startAt: "",

    endAt: "",

    isActive: true,
  });

  const [
    images,
    setImages,
  ] =
    useState<
      BannerImage[]
    >([
      {
        url: "",
        publicId: "",
        alt: "",
      },
    ]);

  const [
    videos,
    setVideos,
  ] =
    useState<
      BannerVideo[]
    >([
      {
        url: "",
        publicId: "",

        poster: {
          url: "",
          publicId: "",
        },

        autoplay: true,
        muted: true,
        loop: true,
        controls: false,
      },
    ]);

  /* ======================================================
     LOAD CATEGORY + PRODUCT
  ====================================================== */

  useEffect(() => {
    const loadData =
      async () => {
        try {
          const [
            categoryResponse,
            productResponse,
          ] =
            await Promise.all(
              [
                fetch(
                  `${API_URL}/api/categories`,
                  {
                    credentials:
                      "include",

                    cache:
                      "no-store",
                  }
                ),

                fetch(
                  `${API_URL}/api/products`,
                  {
                    credentials:
                      "include",

                    cache:
                      "no-store",
                  }
                ),
              ]
            );

          const categoryData =
            await categoryResponse.json();

          const productData =
            await productResponse.json();

          setCategories(
            categoryData.data ||
              []
          );

          setProducts(
            productData.data ||
              []
          );
        } catch (
          error
        ) {
          console.error(
            error
          );
        }
      };

    loadData();
  }, []);

  /* ======================================================
     HANDLE FIELD
  ====================================================== */

  const handleChange = (
    event:
      ChangeEvent<
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
      >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      prev => ({
        ...prev,

        [name]:
          name ===
          "sortOrder"
            ? Number(
                value
              )
            : value,
      })
    );
  };

  /* ======================================================
     AUTO SLUG
  ====================================================== */

  const handleTitle =
    (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const value =
        event.target
          .value;

      const slug =
        value
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

      setForm(
        prev => ({
          ...prev,
          title: value,
          slug,
        })
      );
    };

  /* ======================================================
     IMAGE HANDLER
  ====================================================== */

  const updateImage =
    (
      index: number,
      field:
        | "url"
        | "publicId"
        | "alt",
      value: string
    ) => {
      setImages(
        prev =>
          prev.map(
            (
              image,
              i
            ) =>
              i ===
              index
                ? {
                    ...image,
                    [field]:
                      value,
                  }
                : image
          )
      );
    };

  const addImage =
    () => {
      setImages(
        prev => [
          ...prev,

          {
            url: "",
            publicId: "",
            alt: "",
          },
        ]
      );
    };

  const removeImage =
    (
      index: number
    ) => {
      setImages(
        prev =>
          prev.filter(
            (
              _,
              i
            ) =>
              i !==
              index
          )
      );
    };

  /* ======================================================
     VIDEO HANDLER
  ====================================================== */

  const updateVideo =
    (
      index: number,
      field:
        | "url"
        | "publicId",
      value: string
    ) => {
      setVideos(
        prev =>
          prev.map(
            (
              video,
              i
            ) =>
              i ===
              index
                ? {
                    ...video,
                    [field]:
                      value,
                  }
                : video
          )
      );
    };

  const updatePoster =
    (
      index: number,
      field:
        | "url"
        | "publicId",
      value: string
    ) => {
      setVideos(
        prev =>
          prev.map(
            (
              video,
              i
            ) =>
              i ===
              index
                ? {
                    ...video,

                    poster: {
                      ...video.poster,

                      [field]:
                        value,
                    },
                  }
                : video
          )
      );
    };

  /* ======================================================
     SUBMIT
  ====================================================== */

  const handleSubmit =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      setLoading(
        true
      );

      setMessage("");

      try {
        const body = {
          ...form,

          category:
            form.linkType ===
            "category"
              ? form.category ||
                null
              : null,

          product:
            form.linkType ===
            "product"
              ? form.product ||
                null
              : null,

          page:
            form.linkType ===
            "page"
              ? form.page ||
                null
              : null,

          customLink:
            form.linkType ===
            "custom"
              ? form.customLink
              : "",

          images:
            form.mediaType ===
            "image"
              ? images.filter(
                  image =>
                    image.url &&
                    image.publicId
                )
              : [],

          videos:
            form.mediaType ===
            "video"
              ? videos.filter(
                  video =>
                    video.url &&
                    video.publicId
                )
              : [],

          startAt:
            form.startAt ||
            null,

          endAt:
            form.endAt ||
            null,
        };

        const response =
          await fetch(
            `${API_URL}/api/banners`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify(
                  body
                ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.message ||
              "Failed to create banner."
          );
        }

        router.push(
          "/admin/banners"
        );

        router.refresh();
      } catch (error) {
        setMessage(
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

  return (
    <div className="min-h-screen bg-[#f7f3ef] px-8 py-8">
      {/* HEADER */}

      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a6163c]">
          Banner
          Management
        </p>

        <h1 className="text-3xl font-semibold text-[#17110f]">
          Add Banner
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Create homepage,
          category or
          promotional banner.
        </p>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >
        {/* BASIC */}

        <Section title="Basic Details">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Title"
              name="title"
              value={
                form.title
              }
              onChange={
                handleTitle
              }
              required
            />

            <Input
              label="Slug"
              name="slug"
              value={
                form.slug
              }
              onChange={
                handleChange
              }
              required
            />

            <Input
              label="Subtitle"
              name="subtitle"
              value={
                form.subtitle
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Button Text"
              name="buttonText"
              value={
                form.buttonText
              }
              onChange={
                handleChange
              }
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              rows={5}
              className="w-full rounded-xl border border-[#ddd6d0] px-4 py-3 outline-none focus:border-[#a6163c]"
            />
          </div>
        </Section>

        {/* MEDIA */}

        <Section title="Banner Media">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Media Type
            </label>

            <select
              name="mediaType"
              value={
                form.mediaType
              }
              onChange={
                handleChange
              }
              className="w-full rounded-xl border border-[#ddd6d0] px-4 py-3"
            >
              <option value="image">
                Image
              </option>

              <option value="video">
                Video
              </option>
            </select>
          </div>

          {form.mediaType ===
            "image" && (
            <div className="space-y-4">
              {images.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="rounded-xl border p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input
                        label="Image URL"
                        value={
                          image.url
                        }
                        onChange={event =>
                          updateImage(
                            index,
                            "url",
                            event
                              .target
                              .value
                          )
                        }
                      />

                      <Input
                        label="Public ID"
                        value={
                          image.publicId
                        }
                        onChange={event =>
                          updateImage(
                            index,
                            "publicId",
                            event
                              .target
                              .value
                          )
                        }
                      />

                      <Input
                        label="ALT"
                        value={
                          image.alt
                        }
                        onChange={event =>
                          updateImage(
                            index,
                            "alt",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </div>

                    {images.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                        className="mt-3 text-xs font-semibold text-red-500"
                      >
                        REMOVE
                        IMAGE
                      </button>
                    )}
                  </div>
                )
              )}

              <button
                type="button"
                onClick={
                  addImage
                }
                className="rounded-lg border px-4 py-2 text-sm"
              >
                + ADD IMAGE
              </button>
            </div>
          )}

          {form.mediaType ===
            "video" && (
            <div className="rounded-xl border p-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Video URL"
                  value={
                    videos[0]
                      .url
                  }
                  onChange={event =>
                    updateVideo(
                      0,
                      "url",
                      event
                        .target
                        .value
                    )
                  }
                />

                <Input
                  label="Video Public ID"
                  value={
                    videos[0]
                      .publicId
                  }
                  onChange={event =>
                    updateVideo(
                      0,
                      "publicId",
                      event
                        .target
                        .value
                    )
                  }
                />

                <Input
                  label="Poster URL"
                  value={
                    videos[0]
                      .poster
                      .url
                  }
                  onChange={event =>
                    updatePoster(
                      0,
                      "url",
                      event
                        .target
                        .value
                    )
                  }
                />

                <Input
                  label="Poster Public ID"
                  value={
                    videos[0]
                      .poster
                      .publicId
                  }
                  onChange={event =>
                    updatePoster(
                      0,
                      "publicId",
                      event
                        .target
                        .value
                    )
                  }
                />
              </div>
            </div>
          )}
        </Section>

        {/* LINK */}

        <Section title="Banner Link">
          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Link Type"
              name="linkType"
              value={
                form.linkType
              }
              onChange={
                handleChange
              }
            >
              <option value="none">
                No Link
              </option>

              <option value="custom">
                Custom
                Link
              </option>

              <option value="category">
                Category
              </option>

              <option value="product">
                Product
              </option>

              <option value="page">
                Page
              </option>
            </Select>

            {form.linkType ===
              "custom" && (
              <Input
                label="Custom Link"
                name="customLink"
                value={
                  form.customLink
                }
                onChange={
                  handleChange
                }
              />
            )}

            {form.linkType ===
              "category" && (
              <Select
                label="Category"
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  Select
                  category
                </option>

                {categories.map(
                  category => (
                    <option
                      key={
                        category._id
                      }
                      value={
                        category._id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </Select>
            )}

            {form.linkType ===
              "product" && (
              <Select
                label="Product"
                name="product"
                value={
                  form.product
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  Select
                  product
                </option>

                {products.map(
                  product => (
                    <option
                      key={
                        product._id
                      }
                      value={
                        product._id
                      }
                    >
                      {
                        product.name
                      }
                    </option>
                  )
                )}
              </Select>
            )}
          </div>
        </Section>

        {/* PLACEMENT */}

        <Section title="Placement">
          <div className="grid gap-5 md:grid-cols-3">
            <Select
              label="Position"
              name="position"
              value={
                form.position
              }
              onChange={
                handleChange
              }
            >
              <option value="home_hero">
                Home Hero
              </option>

              <option value="home_top">
                Home Top
              </option>

              <option value="home_middle">
                Home Middle
              </option>

              <option value="home_bottom">
                Home Bottom
              </option>

              <option value="category_top">
                Category
                Top
              </option>

              <option value="category_middle">
                Category
                Middle
              </option>
            </Select>

            <Select
              label="Device"
              name="device"
              value={
                form.device
              }
              onChange={
                handleChange
              }
            >
              <option value="all">
                All
              </option>

              <option value="desktop">
                Desktop
              </option>

              <option value="mobile">
                Mobile
              </option>
            </Select>

            <Input
              label="Sort Order"
              name="sortOrder"
              type="number"
              value={
                form.sortOrder
              }
              onChange={
                handleChange
              }
            />
          </div>
        </Section>

        {/* SCHEDULE */}

        <Section title="Schedule">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Start Date"
              type="datetime-local"
              name="startAt"
              value={
                form.startAt
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="End Date"
              type="datetime-local"
              name="endAt"
              value={
                form.endAt
              }
              onChange={
                handleChange
              }
            />
          </div>
        </Section>

        {/* STATUS */}

        <Section title="Status">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={
                form.isActive
              }
              onChange={event =>
                setForm(
                  prev => ({
                    ...prev,
                    isActive:
                      event
                        .target
                        .checked,
                  })
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm">
              Banner Active
            </span>
          </label>

          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={
                form.openInNewTab
              }
              onChange={event =>
                setForm(
                  prev => ({
                    ...prev,
                    openInNewTab:
                      event
                        .target
                        .checked,
                  })
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm">
              Open link in
              new tab
            </span>
          </label>
        </Section>

        {message && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {message}
          </div>
        )}

        {/* BUTTON */}

        <div className="flex justify-end gap-4 pb-10">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/banners"
              )
            }
            className="rounded-xl border px-7 py-4 text-sm font-semibold"
          >
            CANCEL
          </button>

          <button
            type="submit"
            disabled={
              loading
            }
            className="rounded-xl bg-[#a6163c] px-8 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "SAVING..."
              : "SAVE BANNER"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   SECTION COMPONENT
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;

  children:
    React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[#e8e1db] bg-white p-7">
      <h2 className="mb-6 text-lg font-semibold text-[#17110f]">
        {title}
      </h2>

      {children}
    </div>
  );
}

/* =========================================================
   INPUT COMPONENT
========================================================= */

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#29211e]">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-[#ddd6d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a6163c]"
      />
    </div>
  );
}

/* =========================================================
   SELECT COMPONENT
========================================================= */

function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#29211e]">
        {label}
      </label>

      <select
        {...props}
        className="w-full rounded-xl border border-[#ddd6d0] bg-white px-4 py-3 text-sm outline-none focus:border-[#a6163c]"
      >
        {children}
      </select>
    </div>
  );
}