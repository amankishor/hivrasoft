"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type ProductFormProps = {
  mode?:
    | "create"
    | "edit";

  productId?: string;
};

type CategoryNode = {
  id: string;

  _id?: string;

  name: string;

  slug: string;

  level: number;

  children: CategoryNode[];
};

type ImageInput = {
  url: string;

  publicId: string;
};

type SizeInput = {
  size: string;

  sku: string;

  stock: string;

  isActive: boolean;
};

type ColorInput = {
  name: string;

  hex: string;

  images: [
    ImageInput,
    ImageInput,
  ];

  sizes: SizeInput[];

  isActive: boolean;
};

type ProductStatus =
  | "draft"
  | "active"
  | "inactive";

type ProductApiData = {
  _id?: string;

  id?: string;

  name?: string;

  shortDescription?: string;

  description?: string;

  categories?: Array<
    | string
    | {
        _id?: string;
        id?: string;
      }
  >;

  price?: number;

  compareAtPrice?: number;

  costPrice?: number;

  mainImages?: ImageInput[];

  colors?: Array<{
    name?: string;

    hex?: string;

    images?: ImageInput[];

    sizes?: Array<{
      size?: string;

      sku?: string;

      stock?: number;

      isActive?: boolean;
    }>;

    isActive?: boolean;
  }>;

  status?: ProductStatus;

  isFeatured?: boolean;

  isNewLaunch?: boolean;

  tags?: string[];

  seoTitle?: string;

  seoDescription?: string;
};

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   EMPTY
========================================================= */

const emptyImage =
  (): ImageInput => ({
    url: "",

    publicId: "",
  });

const emptySize =
  (): SizeInput => ({
    size: "",

    sku: "",

    stock: "0",

    isActive: true,
  });

const emptyColor =
  (): ColorInput => ({
    name: "",

    hex: "#000000",

    images: [
      emptyImage(),
      emptyImage(),
    ],

    sizes: [
      emptySize(),
    ],

    isActive: true,
  });

/* =========================================================
   PRODUCT FORM
========================================================= */

export default function ProductForm({
  mode = "create",

  productId,
}: ProductFormProps) {
  const router =
    useRouter();

  const isEdit =
    mode === "edit";

  /* =======================================================
     CATEGORY
  ======================================================= */

  const [
    categories,
    setCategories,
  ] = useState<
    CategoryNode[]
  >([]);

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState<
    string[]
  >([]);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  /* =======================================================
     BASIC
  ======================================================= */

  const [
    name,
    setName,
  ] = useState("");

  const [
    shortDescription,
    setShortDescription,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  /* =======================================================
     PRICE
  ======================================================= */

  const [
    price,
    setPrice,
  ] = useState("");

  const [
    compareAtPrice,
    setCompareAtPrice,
  ] = useState("");

  const [
    costPrice,
    setCostPrice,
  ] = useState("");

  /* =======================================================
     IMAGES
  ======================================================= */

  const [
    mainImages,
    setMainImages,
  ] = useState<
    ImageInput[]
  >([
    emptyImage(),
    emptyImage(),
    emptyImage(),
    emptyImage(),
  ]);

  /* =======================================================
     COLORS
  ======================================================= */

  const [
    colors,
    setColors,
  ] = useState<
    ColorInput[]
  >([
    emptyColor(),
  ]);

  /* =======================================================
     PUBLISHING
  ======================================================= */

  const [
    status,
    setStatus,
  ] =
    useState<ProductStatus>(
      "draft",
    );

  const [
    isFeatured,
    setIsFeatured,
  ] = useState(false);

  const [
    isNewLaunch,
    setIsNewLaunch,
  ] = useState(false);

  /* =======================================================
     EXTRA
  ======================================================= */

  const [
    tags,
    setTags,
  ] = useState("");

  const [
    seoTitle,
    setSeoTitle,
  ] = useState("");

  const [
    seoDescription,
    setSeoDescription,
  ] = useState("");

  /* =======================================================
     FORM
  ======================================================= */

  const [
    productLoading,
    setProductLoading,
  ] = useState(
    isEdit,
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  useEffect(() => {
    const loadCategories =
      async () => {
        try {
          setCategoriesLoading(
            true,
          );

          const response =
            await fetch(
              `${API_URL}/api/categories/tree`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load categories.",
            );
          }

          setCategories(
            Array.isArray(
              data.categories,
            )
              ? data.categories
              : [],
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load categories.",
          );
        } finally {
          setCategoriesLoading(
            false,
          );
        }
      };

    void loadCategories();
  }, []);

  /* =========================================================
     LOAD PRODUCT FOR EDIT
  ========================================================= */

  useEffect(() => {
    if (!isEdit) {
      setProductLoading(
        false,
      );

      return;
    }

    if (!productId) {
      setError(
        "Product ID is missing.",
      );

      setProductLoading(
        false,
      );

      return;
    }

    let cancelled = false;

    const loadProduct =
      async () => {
        try {
          setProductLoading(
            true,
          );

          setError("");

          const response =
            await fetch(
              `${API_URL}/api/products/${productId}`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load product.",
            );
          }

          if (cancelled) {
            return;
          }

          const product: ProductApiData =
            data.product ||
            data.data ||
            data;

          /* BASIC */

          setName(
            product.name || "",
          );

          setShortDescription(
            product.shortDescription ||
              "",
          );

          setDescription(
            product.description ||
              "",
          );

          /* PRICE */

          setPrice(
            product.price !==
              undefined &&
              product.price !==
                null
              ? String(
                  product.price,
                )
              : "",
          );

          setCompareAtPrice(
            product.compareAtPrice
              ? String(
                  product.compareAtPrice,
                )
              : "",
          );

          setCostPrice(
            product.costPrice
              ? String(
                  product.costPrice,
                )
              : "",
          );

          /* CATEGORIES */

          const categoryIds =
            (
              product.categories ||
              []
            )
              .map(
                (category) => {
                  if (
                    typeof category ===
                    "string"
                  ) {
                    return category;
                  }

                  return (
                    category.id ||
                    category._id ||
                    ""
                  );
                },
              )
              .filter(Boolean);

          setSelectedCategories(
            categoryIds,
          );

          /* IMAGES */

          setMainImages(
            normalizeMainImages(
              product.mainImages ||
                [],
            ),
          );

          /* COLORS */

          setColors(
            normalizeColors(
              product.colors ||
                [],
            ),
          );

          /* PUBLISH */

          setStatus(
            product.status ||
              "draft",
          );

          setIsFeatured(
            Boolean(
              product.isFeatured,
            ),
          );

          setIsNewLaunch(
            Boolean(
              product.isNewLaunch,
            ),
          );

          /* EXTRA */

          setTags(
            Array.isArray(
              product.tags,
            )
              ? product.tags.join(
                  ", ",
                )
              : "",
          );

          setSeoTitle(
            product.seoTitle ||
              "",
          );

          setSeoDescription(
            product.seoDescription ||
              "",
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          setError(
            error instanceof Error
              ? error.message
              : "Unable to load product.",
          );
        } finally {
          if (!cancelled) {
            setProductLoading(
              false,
            );
          }
        }
      };

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [
    isEdit,
    productId,
  ]);

  /* =========================================================
     CATEGORY
  ========================================================= */

  const toggleCategory = (
    categoryId: string,
  ) => {
    setSelectedCategories(
      (current) =>
        current.includes(
          categoryId,
        )
          ? current.filter(
              (id) =>
                id !==
                categoryId,
            )
          : [
              ...current,

              categoryId,
            ],
    );
  };

  /* =========================================================
     MAIN IMAGE
  ========================================================= */

  const setMainImage = (
    index: number,

    image: ImageInput,
  ) => {
    setMainImages(
      (current) =>
        current.map(
          (
            currentImage,

            currentIndex,
          ) =>
            currentIndex ===
            index
              ? image
              : currentImage,
        ),
    );
  };

  /* =========================================================
     COLORS
  ========================================================= */

  const addColor = () => {
    setColors(
      (current) => [
        ...current,

        emptyColor(),
      ],
    );
  };

  const removeColor = (
    colorIndex: number,
  ) => {
    setColors(
      (current) =>
        current.filter(
          (
            _,

            currentIndex,
          ) =>
            currentIndex !==
            colorIndex,
        ),
    );
  };

  const updateColor = (
    colorIndex: number,

    field:
      | "name"
      | "hex"
      | "isActive",

    value:
      | string
      | boolean,
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,

            currentIndex,
          ) =>
            currentIndex ===
            colorIndex
              ? {
                  ...color,

                  [field]:
                    value,
                }
              : color,
        ),
    );
  };

  const setColorImage = (
    colorIndex: number,

    imageIndex: number,

    image: ImageInput,
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,

            currentIndex,
          ) => {
            if (
              currentIndex !==
              colorIndex
            ) {
              return color;
            }

            const nextImages =
              [
                ...color.images,
              ] as [
                ImageInput,
                ImageInput,
              ];

            nextImages[
              imageIndex
            ] = image;

            return {
              ...color,

              images:
                nextImages,
            };
          },
        ),
    );
  };

  /* =========================================================
     SIZES
  ========================================================= */

  const addSize = (
    colorIndex: number,
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,

            currentIndex,
          ) =>
            currentIndex ===
            colorIndex
              ? {
                  ...color,

                  sizes: [
                    ...color.sizes,

                    emptySize(),
                  ],
                }
              : color,
        ),
    );
  };

  const removeSize = (
    colorIndex: number,

    sizeIndex: number,
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,

            currentIndex,
          ) => {
            if (
              currentIndex !==
              colorIndex
            ) {
              return color;
            }

            return {
              ...color,

              sizes:
                color.sizes.filter(
                  (
                    _,

                    currentSizeIndex,
                  ) =>
                    currentSizeIndex !==
                    sizeIndex,
                ),
            };
          },
        ),
    );
  };

  const updateSize = (
    colorIndex: number,

    sizeIndex: number,

    field:
      | "size"
      | "sku"
      | "stock"
      | "isActive",

    value:
      | string
      | boolean,
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,

            currentColorIndex,
          ) => {
            if (
              currentColorIndex !==
              colorIndex
            ) {
              return color;
            }

            return {
              ...color,

              sizes:
                color.sizes.map(
                  (
                    size,

                    currentSizeIndex,
                  ) =>
                    currentSizeIndex ===
                    sizeIndex
                      ? {
                          ...size,

                          [field]:
                            value,
                        }
                      : size,
                ),
            };
          },
        ),
    );
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      setError("");

      setSuccess("");

      /* VALIDATION */

      if (!name.trim()) {
        showFormError(
          "Product name is required.",
        );

        return;
      }

      if (
        selectedCategories.length ===
        0
      ) {
        showFormError(
          "Please select at least one category.",
        );

        return;
      }

      if (
        price.trim() === "" ||
        !Number.isFinite(
          Number(price),
        ) ||
        Number(price) < 0
      ) {
        showFormError(
          "Please enter a valid selling price.",
        );

        return;
      }

      try {
        setSaving(true);

        const cleanedMainImages =
          mainImages.filter(
            (image) =>
              image.url &&
              image.publicId,
          );

        const cleanedColors =
          colors
            .filter(
              (color) =>
                color.name.trim(),
            )
            .map(
              (
                color,

                colorIndex,
              ) => ({
                name:
                  color.name.trim(),

                hex:
                  color.hex.trim(),

                sortOrder:
                  colorIndex,

                isActive:
                  color.isActive,

                images:
                  color.images.filter(
                    (image) =>
                      image.url &&
                      image.publicId,
                  ),

                sizes:
                  color.sizes
                    .filter(
                      (size) =>
                        size.size.trim() &&
                        size.sku.trim(),
                    )
                    .map(
                      (size) => ({
                        size:
                          size.size
                            .trim()
                            .toUpperCase(),

                        sku:
                          size.sku
                            .trim()
                            .toUpperCase(),

                        stock:
                          Math.max(
                            0,

                            Number(
                              size.stock,
                            ) || 0,
                          ),

                        isActive:
                          size.isActive,
                      }),
                    ),
              }),
            );

        const payload = {
          name:
            name.trim(),

          shortDescription:
            shortDescription.trim(),

          description:
            description.trim(),

          categories:
            selectedCategories,

          price:
            Number(price),

          compareAtPrice:
            compareAtPrice
              ? Number(
                  compareAtPrice,
                )
              : 0,

          costPrice:
            costPrice
              ? Number(
                  costPrice,
                )
              : 0,

          mainImages:
            cleanedMainImages,

          colors:
            cleanedColors,

          status,

          isFeatured,

          isNewLaunch,

          tags: tags
            .split(",")
            .map((tag) =>
              tag
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean),

          seoTitle:
            seoTitle.trim(),

          seoDescription:
            seoDescription.trim(),
        };

        /* CREATE / EDIT URL */

        const url = isEdit
          ? `${API_URL}/api/products/${productId}`
          : `${API_URL}/api/products`;

        const response =
          await fetch(url, {
            method: isEdit
              ? "PUT"
              : "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          });

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              (isEdit
                ? "Unable to update product."
                : "Unable to create product."),
          );
        }

        setSuccess(
          isEdit
            ? "Product updated successfully."
            : "Product created successfully.",
        );

        window.scrollTo({
          top: 0,

          behavior:
            "smooth",
        });

        window.setTimeout(
          () => {
            router.push(
              "/admin/products",
            );

            router.refresh();
          },
          700,
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : isEdit
              ? "Unable to update product."
              : "Unable to create product.",
        );

        window.scrollTo({
          top: 0,

          behavior:
            "smooth",
        });
      } finally {
        setSaving(false);
      }
    };

  const showFormError = (
    message: string,
  ) => {
    setError(message);

    window.scrollTo({
      top: 0,

      behavior:
        "smooth",
    });
  };

  /* =========================================================
     PRODUCT LOADING
  ========================================================= */

  if (productLoading) {
    return (
      <div
        className="
          mx-auto
          max-w-[1500px]
        "
      >
        <div
          className="
            flex
            min-h-[450px]
            items-center
            justify-center
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
          "
        >
          <div
            className="
              text-center
            "
          >
            <LoadingSpinner />

            <p
              className="
                mt-4
                text-[10px]
                uppercase
                tracking-[0.1em]
                text-[#211A18]/45
              "
            >
              Loading product...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="
        mx-auto
        max-w-[1500px]
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-4

          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.24em]
              text-[#8C1839]
            "
          >
            Catalog Management
          </p>

          <h2
            className="
              mt-2
              text-[27px]
              font-semibold
              text-[#211A18]
            "
          >
            {isEdit
              ? "Edit Product"
              : "Add Product"}
          </h2>

          <p
            className="
              mt-1
              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            {isEdit
              ? "Update product information, images, colors, sizes and inventory."
              : "Create product information, images, colors, sizes and inventory."}
          </p>
        </div>

        <div
          className="
            flex
            gap-3
          "
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/products",
              )
            }
            className="
              h-[46px]
              rounded-[12px]
              border
              border-[#211A18]/10
              bg-white
              px-5
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.1em]
              text-[#211A18]
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="
              h-[46px]
              rounded-[12px]
              bg-[#8C1839]
              px-6
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-white
              transition

              hover:bg-[#211A18]

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {saving
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update Product"
                : "Save Product"}
          </button>
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <div
          className="
            mt-5
            rounded-[14px]
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-[11px]
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="
            mt-5
            rounded-[14px]
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-[11px]
            text-green-700
          "
        >
          {success}
        </div>
      )}

      {/* GRID */}

      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-6

          xl:grid-cols-[minmax(0,1fr)_360px]
        "
      >
        {/* LEFT */}

        <div
          className="
            min-w-0
            space-y-6
          "
        >
          {/* PRODUCT DETAILS */}

          <Card title="Product Details">
            <div
              className="
                space-y-5
              "
            >
              <Field
                label="Product Name"
                required
              >
                <input
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="e.g. Everyday Sports Bra"
                  className={
                    inputClass
                  }
                />
              </Field>

              <Field label="Short Description">
                <input
                  value={
                    shortDescription
                  }
                  onChange={(
                    event,
                  ) =>
                    setShortDescription(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Short description for product listing"
                  className={
                    inputClass
                  }
                />
              </Field>

              <Field label="Full Description">
                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event,
                  ) =>
                    setDescription(
                      event.target
                        .value,
                    )
                  }
                  rows={7}
                  placeholder="Enter complete product description..."
                  className={`
                    ${inputClass}

                    h-auto
                    resize-y
                    py-3
                  `}
                />
              </Field>
            </div>
          </Card>

          {/* PRICING */}

          <Card title="Pricing">
            <div
              className="
                grid
                grid-cols-1
                gap-4

                md:grid-cols-3
              "
            >
              <Field
                label="Selling Price"
                required
              >
                <CurrencyInput
                  value={price}
                  onChange={
                    setPrice
                  }
                  placeholder="999"
                />
              </Field>

              <Field label="Compare At Price">
                <CurrencyInput
                  value={
                    compareAtPrice
                  }
                  onChange={
                    setCompareAtPrice
                  }
                  placeholder="1499"
                />
              </Field>

              <Field label="Cost Price">
                <CurrencyInput
                  value={
                    costPrice
                  }
                  onChange={
                    setCostPrice
                  }
                  placeholder="500"
                />
              </Field>
            </div>
          </Card>

          {/* MAIN IMAGES */}

          <Card title="Main Product Images">
            <p
              className="
                mb-5
                text-[10px]
                leading-5
                text-[#211A18]/45
              "
            >
              Upload maximum 4
              product images. First
              image will be used as the
              main image.
            </p>

            <div
              className="
                grid
                grid-cols-1
                gap-4

                sm:grid-cols-2

                2xl:grid-cols-4
              "
            >
              {mainImages.map(
                (
                  image,

                  index,
                ) => (
                  <ImageUploader
                    key={index}
                    label={`Image ${
                      index + 1
                    }`}
                    value={image}
                    folder="products/main"
                    onChange={(
                      uploadedImage,
                    ) =>
                      setMainImage(
                        index,

                        uploadedImage,
                      )
                    }
                  />
                ),
              )}
            </div>
          </Card>

          {/* COLORS */}

          <Card
            title="Color Variants"
            action={
              <button
                type="button"
                onClick={
                  addColor
                }
                className="
                  rounded-[10px]
                  bg-[#211A18]
                  px-4
                  py-2.5
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-white
                  transition

                  hover:bg-[#8C1839]
                "
              >
                + Add Color
              </button>
            }
          >
            <div
              className="
                space-y-5
              "
            >
              {colors.map(
                (
                  color,

                  colorIndex,
                ) => (
                  <div
                    key={
                      colorIndex
                    }
                    className="
                      rounded-[20px]
                      border
                      border-[#211A18]/10
                      bg-[#FAF8F6]
                      p-5
                    "
                  >
                    {/* HEADER */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-[9px]
                            font-semibold
                            uppercase
                            tracking-[0.15em]
                            text-[#8C1839]
                          "
                        >
                          Variant
                        </p>

                        <h4
                          className="
                            mt-1
                            text-[14px]
                            font-semibold
                            text-[#211A18]
                          "
                        >
                          Color{" "}
                          {colorIndex +
                            1}
                        </h4>
                      </div>

                      {colors.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeColor(
                              colorIndex,
                            )
                          }
                          className="
                            rounded-[9px]
                            border
                            border-red-200
                            px-3
                            py-2
                            text-[8px]
                            font-semibold
                            uppercase
                            text-red-500

                            hover:bg-red-500
                            hover:text-white
                          "
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* INFO */}

                    <div
                      className="
                        mt-5
                        grid
                        grid-cols-1
                        gap-4

                        md:grid-cols-[1fr_140px]
                      "
                    >
                      <Field
                        label="Color Name"
                        required
                      >
                        <input
                          value={
                            color.name
                          }
                          onChange={(
                            event,
                          ) =>
                            updateColor(
                              colorIndex,

                              "name",

                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Black"
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field label="Color">
                        <div
                          className="
                            flex
                            h-[48px]
                            items-center
                            gap-3
                            rounded-[12px]
                            border
                            border-[#211A18]/12
                            bg-white
                            px-3
                          "
                        >
                          <input
                            type="color"
                            value={
                              color.hex
                            }
                            onChange={(
                              event,
                            ) =>
                              updateColor(
                                colorIndex,

                                "hex",

                                event
                                  .target
                                  .value,
                              )
                            }
                            className="
                              h-8
                              w-10
                              cursor-pointer
                            "
                          />

                          <span
                            className="
                              text-[10px]
                              uppercase
                              text-[#211A18]/55
                            "
                          >
                            {color.hex}
                          </span>
                        </div>
                      </Field>
                    </div>

                    {/* COLOR IMAGES */}

                    <div
                      className="
                        mt-6
                      "
                    >
                      <p
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-[0.14em]
                          text-[#211A18]/55
                        "
                      >
                        Color Images
                      </p>

                      <div
                        className="
                          mt-4
                          grid
                          grid-cols-1
                          gap-4

                          sm:grid-cols-2

                          xl:max-w-[650px]
                        "
                      >
                        {color.images.map(
                          (
                            image,

                            imageIndex,
                          ) => (
                            <ImageUploader
                              key={
                                imageIndex
                              }
                              label={`Color Image ${
                                imageIndex +
                                1
                              }`}
                              value={
                                image
                              }
                              folder={`products/colors/${
                                slugifyFolder(
                                  color.name,
                                ) ||
                                `color-${
                                  colorIndex +
                                  1
                                }`
                              }`}
                              onChange={(
                                uploaded,
                              ) =>
                                setColorImage(
                                  colorIndex,

                                  imageIndex,

                                  uploaded,
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>

                    {/* SIZES */}

                    <div
                      className="
                        mt-7
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        "
                      >
                        <div>
                          <p
                            className="
                              text-[9px]
                              font-semibold
                              uppercase
                              tracking-[0.14em]
                              text-[#211A18]/55
                            "
                          >
                            Sizes &
                            Inventory
                          </p>

                          <p
                            className="
                              mt-1
                              text-[9px]
                              text-[#211A18]/35
                            "
                          >
                            Each size has
                            its own SKU
                            and stock.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addSize(
                              colorIndex,
                            )
                          }
                          className="
                            rounded-[9px]
                            border
                            border-[#8C1839]/20
                            px-3
                            py-2
                            text-[8px]
                            font-semibold
                            uppercase
                            text-[#8C1839]

                            hover:bg-[#8C1839]
                            hover:text-white
                          "
                        >
                          + Add Size
                        </button>
                      </div>

                      <div
                        className="
                          mt-4
                          space-y-3
                        "
                      >
                        {color.sizes.map(
                          (
                            size,

                            sizeIndex,
                          ) => (
                            <div
                              key={
                                sizeIndex
                              }
                              className="
                                grid
                                grid-cols-1
                                gap-3
                                rounded-[14px]
                                border
                                border-[#211A18]/10
                                bg-white
                                p-3

                                md:grid-cols-[110px_minmax(150px,1fr)_120px_90px_auto]
                                md:items-center
                              "
                            >
                              <input
                                value={
                                  size.size
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateSize(
                                    colorIndex,

                                    sizeIndex,

                                    "size",

                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="Size"
                                className={
                                  smallInputClass
                                }
                              />

                              <input
                                value={
                                  size.sku
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateSize(
                                    colorIndex,

                                    sizeIndex,

                                    "sku",

                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="SKU"
                                className={
                                  smallInputClass
                                }
                              />

                              <input
                                type="number"
                                min="0"
                                value={
                                  size.stock
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateSize(
                                    colorIndex,

                                    sizeIndex,

                                    "stock",

                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="Stock"
                                className={
                                  smallInputClass
                                }
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  updateSize(
                                    colorIndex,

                                    sizeIndex,

                                    "isActive",

                                    !size.isActive,
                                  )
                                }
                                className={`
                                  h-[42px]
                                  rounded-[10px]
                                  text-[8px]
                                  font-semibold
                                  uppercase

                                  ${
                                    size.isActive
                                      ? "bg-green-50 text-green-700"
                                      : "bg-[#211A18]/5 text-[#211A18]/40"
                                  }
                                `}
                              >
                                {size.isActive
                                  ? "Active"
                                  : "Off"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSize(
                                    colorIndex,

                                    sizeIndex,
                                  )
                                }
                                className="
                                  h-[42px]
                                  rounded-[10px]
                                  px-3
                                  text-[8px]
                                  font-semibold
                                  uppercase
                                  text-red-500

                                  hover:bg-red-50
                                "
                              >
                                Remove
                              </button>
                            </div>
                          ),
                        )}

                        {color.sizes
                          .length ===
                          0 && (
                          <button
                            type="button"
                            onClick={() =>
                              addSize(
                                colorIndex,
                              )
                            }
                            className="
                              w-full
                              rounded-[12px]
                              border
                              border-dashed
                              border-[#211A18]/15
                              bg-white
                              py-4
                              text-[9px]
                              text-[#211A18]/45
                            "
                          >
                            + Add first
                            size
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ACTIVE COLOR */}

                    <div
                      className="
                        mt-5
                        flex
                        items-center
                        justify-between
                        rounded-[14px]
                        border
                        border-[#211A18]/10
                        bg-white
                        px-4
                        py-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-[10px]
                            font-semibold
                          "
                        >
                          Active Color
                        </p>

                        <p
                          className="
                            mt-1
                            text-[8px]
                            text-[#211A18]/40
                          "
                        >
                          Show this color
                          to customers.
                        </p>
                      </div>

                      <Toggle
                        checked={
                          color.isActive
                        }
                        onChange={(
                          value,
                        ) =>
                          updateColor(
                            colorIndex,

                            "isActive",

                            value,
                          )
                        }
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>

          {/* SEO */}

          <Card title="SEO">
            <div
              className="
                space-y-4
              "
            >
              <Field label="SEO Title">
                <input
                  value={
                    seoTitle
                  }
                  onChange={(
                    event,
                  ) =>
                    setSeoTitle(
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="SEO title"
                />
              </Field>

              <Field label="SEO Description">
                <textarea
                  value={
                    seoDescription
                  }
                  onChange={(
                    event,
                  ) =>
                    setSeoDescription(
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  placeholder="SEO description"
                  className={`
                    ${inputClass}

                    h-auto
                    py-3
                  `}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* RIGHT */}

        <div
          className="
            min-w-0
            space-y-6

            xl:sticky
            xl:top-[100px]
            xl:h-fit
          "
        >
          {/* PUBLISHING */}

          <Card title="Publishing">
            <Field label="Status">
              <select
                value={status}
                onChange={(
                  event,
                ) =>
                  setStatus(
                    event.target
                      .value as ProductStatus,
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="draft">
                  Draft
                </option>

                <option value="active">
                  Published
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </Field>

            <div
              className="
                mt-4
                space-y-3
              "
            >
              <ToggleRow
                label="Featured Product"
                description="Feature this product on selected storefront sections."
                checked={
                  isFeatured
                }
                onChange={
                  setIsFeatured
                }
              />

              <ToggleRow
                label="New Launch"
                description="Mark this product as a new launch."
                checked={
                  isNewLaunch
                }
                onChange={
                  setIsNewLaunch
                }
              />
            </div>
          </Card>

          {/* CATEGORIES */}

          <Card title="Categories">
            {categoriesLoading ? (
              <div
                className="
                  flex
                  items-center
                  gap-3
                  py-5
                  text-[10px]
                  text-[#211A18]/45
                "
              >
                <LoadingSpinner />

                Loading categories...
              </div>
            ) : categories.length ===
              0 ? (
              <p
                className="
                  text-[10px]
                  text-[#211A18]/45
                "
              >
                No categories found.
              </p>
            ) : (
              <div
                className="
                  max-h-[430px]
                  overflow-y-auto
                "
              >
                {categories.map(
                  (
                    category,
                  ) => (
                    <CategoryOption
                      key={
                        category.id ||
                        category._id
                      }
                      category={
                        category
                      }
                      selected={
                        selectedCategories
                      }
                      toggle={
                        toggleCategory
                      }
                    />
                  ),
                )}
              </div>
            )}
          </Card>

          {/* TAGS */}

          <Card title="Tags">
            <textarea
              value={tags}
              onChange={(
                event,
              ) =>
                setTags(
                  event.target
                    .value,
                )
              }
              rows={4}
              placeholder="sports bra, padded, seamless"
              className={`
                ${inputClass}

                h-auto
                py-3
              `}
            />

            <p
              className="
                mt-2
                text-[9px]
                text-[#211A18]/40
              "
            >
              Separate multiple tags
              using commas.
            </p>
          </Card>

          {/* SUMMARY */}

          <Card title="Product Summary">
            <div
              className="
                space-y-3
              "
            >
              <SummaryRow
                label="Main Images"
                value={`${
                  mainImages.filter(
                    (image) =>
                      image.url,
                  ).length
                }/4`}
              />

              <SummaryRow
                label="Colors"
                value={String(
                  colors.filter(
                    (color) =>
                      color.name.trim(),
                  ).length,
                )}
              />

              <SummaryRow
                label="Categories"
                value={String(
                  selectedCategories.length,
                )}
              />

              <SummaryRow
                label="Status"
                value={
                  status === "active"
                    ? "Published"
                    : status
                }
              />
            </div>
          </Card>
        </div>
      </div>

      {/* BOTTOM BUTTON */}

      <div
        className="
          mt-7
          flex
          justify-end
          border-t
          border-[#211A18]/10
          pt-6
        "
      >
        <button
          type="submit"
          disabled={saving}
          className="
            h-[48px]
            min-w-[210px]
            rounded-[12px]
            bg-[#8C1839]
            px-6
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.14em]
            text-white

            hover:bg-[#211A18]

            disabled:opacity-50
          "
        >
          {saving
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
              ? "Update Product"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   IMAGE UPLOADER
========================================================= */

function ImageUploader({
  label,

  value,

  folder,

  onChange,
}: {
  label: string;

  value: ImageInput;

  folder: string;

  onChange: (
    image: ImageInput,
  ) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState("");

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const allowedTypes = [
        "image/jpeg",

        "image/png",

        "image/webp",

        "image/avif",
      ];

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setUploadError(
          "Only JPG, PNG, WEBP or AVIF allowed.",
        );

        return;
      }

      try {
        setUploading(true);

        setUploadError("");

        const formData =
          new FormData();

        formData.append(
          "image",

          file,
        );

        formData.append(
          "folder",

          folder,
        );

        const response =
          await fetch(
            `${API_URL}/api/uploads/image`,
            {
              method:
                "POST",

              credentials:
                "include",

              body:
                formData,
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Image upload failed.",
          );
        }

        if (
          !data.image?.url ||
          !data.image
            ?.publicId
        ) {
          throw new Error(
            "Invalid image response.",
          );
        }

        onChange({
          url:
            data.image.url,

          publicId:
            data.image
              .publicId,
        });
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "Upload failed.",
        );
      } finally {
        setUploading(false);

        if (
          inputRef.current
        ) {
          inputRef.current.value =
            "";
        }
      }
    };

  return (
    <div
      className="
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-[#FAF8F6]
        p-3
      "
    >
      <div
        className="
          mb-3
          flex
          items-center
          justify-between
        "
      >
        <p
          className="
            text-[10px]
            font-semibold
          "
        >
          {label}
        </p>

        {value.url && (
          <button
            type="button"
            onClick={() =>
              onChange(
                emptyImage(),
              )
            }
            className="
              text-[8px]
              font-semibold
              uppercase
              text-red-500
            "
          >
            Remove
          </button>
        )}
      </div>

      {value.url ? (
        <div
          className="
            group
            relative
            aspect-[4/5]
            overflow-hidden
            rounded-[12px]
            bg-[#EFE9E4]
          "
        >
          <img
            src={value.url}
            alt={label}
            className="
              h-full
              w-full
              object-cover
            "
          />

          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-black/40
              text-[9px]
              font-semibold
              uppercase
              text-white
              opacity-0
              transition

              group-hover:opacity-100
            "
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={
            uploading
          }
          onClick={() =>
            inputRef.current?.click()
          }
          className="
            flex
            aspect-[4/5]
            w-full
            flex-col
            items-center
            justify-center
            rounded-[12px]
            border
            border-dashed
            border-[#211A18]/20
            bg-white
            text-[10px]
            font-semibold

            hover:border-[#8C1839]
          "
        >
          {uploading ? (
            <LoadingSpinner />
          ) : (
            <>
              <span
                className="
                  text-[25px]
                  text-[#8C1839]
                "
              >
                +
              </span>

              <span
                className="
                  mt-2
                "
              >
                Choose Image
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={
          handleFileChange
        }
        className="hidden"
      />

      {uploadError && (
        <p
          className="
            mt-2
            text-[8px]
            text-red-500
          "
        >
          {uploadError}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   CATEGORY
========================================================= */

function CategoryOption({
  category,

  selected,

  toggle,
}: {
  category: CategoryNode;

  selected: string[];

  toggle: (
    id: string,
  ) => void;
}) {
  const id =
    category.id ||
    category._id ||
    "";

  return (
    <>
      <label
        style={{
          paddingLeft:
            8 +
            Number(
              category.level ||
                0,
            ) *
              14,
        }}
        className="
          mb-1
          flex
          cursor-pointer
          items-center
          gap-2
          rounded-[9px]
          py-2
          pr-2
          text-[10px]

          hover:bg-[#FAF8F6]
        "
      >
        <input
          type="checkbox"
          checked={
            selected.includes(
              id,
            )
          }
          onChange={() =>
            toggle(id)
          }
          className="
            h-4
            w-4
            accent-[#8C1839]
          "
        />

        <span>
          {category.name}
        </span>
      </label>

      {category.children?.map(
        (child) => (
          <CategoryOption
            key={
              child.id ||
              child._id
            }
            category={child}
            selected={
              selected
            }
            toggle={toggle}
          />
        ),
      )}
    </>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function Card({
  title,

  children,

  action,
}: {
  title: string;

  children: ReactNode;

  action?: ReactNode;
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-[#211A18]/10
        bg-white
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-[#211A18]/10
          px-5
          py-5
        "
      >
        <h3
          className="
            text-[14px]
            font-semibold
          "
        >
          {title}
        </h3>

        {action}
      </div>

      <div
        className="
          p-5
        "
      >
        {children}
      </div>
    </section>
  );
}

function Field({
  label,

  required,

  children,
}: {
  label: string;

  required?: boolean;

  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-[9px]
          font-semibold
          uppercase
          tracking-[0.14em]
          text-[#211A18]/50
        "
      >
        {label}

        {required && (
          <span
            className="
              ml-1
              text-[#8C1839]
            "
          >
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function CurrencyInput({
  value,

  onChange,

  placeholder,
}: {
  value: string;

  onChange: (
    value: string,
  ) => void;

  placeholder: string;
}) {
  return (
    <div
      className="
        flex
        h-[48px]
        overflow-hidden
        rounded-[12px]
        border
        border-[#211A18]/12
        bg-[#FAF8F6]

        focus-within:border-[#8C1839]
      "
    >
      <span
        className="
          flex
          items-center
          border-r
          border-[#211A18]/10
          px-3
          text-[13px]
          font-semibold
        "
      >
        ₹
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className="
          min-w-0
          flex-1
          bg-transparent
          px-3
          text-[12px]
          outline-none
        "
      />
    </div>
  );
}

function ToggleRow({
  label,

  description,

  checked,

  onChange,
}: {
  label: string;

  description: string;

  checked: boolean;

  onChange: (
    value: boolean,
  ) => void;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-[13px]
        bg-[#FAF8F6]
        px-3
        py-3
      "
    >
      <div>
        <p
          className="
            text-[10px]
            font-semibold
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            text-[8px]
            leading-4
            text-[#211A18]/40
          "
        >
          {description}
        </p>
      </div>

      <Toggle
        checked={checked}
        onChange={
          onChange
        }
      />
    </div>
  );
}

function Toggle({
  checked,

  onChange,
}: {
  checked: boolean;

  onChange: (
    value: boolean,
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked,
        )
      }
      className={`
        relative
        h-7
        w-12
        shrink-0
        rounded-full
        transition

        ${
          checked
            ? "bg-[#8C1839]"
            : "bg-[#211A18]/15"
        }
      `}
    >
      <span
        className={`
          absolute
          top-1
          h-5
          w-5
          rounded-full
          bg-white
          shadow
          transition-all

          ${
            checked
              ? "left-6"
              : "left-1"
          }
        `}
      />
    </button>
  );
}

function SummaryRow({
  label,

  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-[11px]
        bg-[#FAF8F6]
        px-3
        py-3
      "
    >
      <span
        className="
          text-[9px]
          text-[#211A18]/50
        "
      >
        {label}
      </span>

      <span
        className="
          text-[9px]
          font-semibold
          capitalize
        "
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   NORMALIZE API DATA
========================================================= */

function normalizeMainImages(
  images: ImageInput[],
): ImageInput[] {
  return Array.from(
    {
      length: 4,
    },

    (_, index) => ({
      url:
        images[index]
          ?.url || "",

      publicId:
        images[index]
          ?.publicId ||
        "",
    }),
  );
}

function normalizeColors(
  apiColors:
    ProductApiData["colors"],
): ColorInput[] {
  if (
    !apiColors ||
    apiColors.length === 0
  ) {
    return [
      emptyColor(),
    ];
  }

  return apiColors.map(
    (color) => {
      const images =
        color.images || [];

      const normalizedImages: [
        ImageInput,
        ImageInput,
      ] = [
        {
          url:
            images[0]?.url ||
            "",

          publicId:
            images[0]
              ?.publicId ||
            "",
        },

        {
          url:
            images[1]?.url ||
            "",

          publicId:
            images[1]
              ?.publicId ||
            "",
        },
      ];

      const sizes: SizeInput[] =
        color.sizes &&
        color.sizes.length >
          0
          ? color.sizes.map(
              (size) => ({
                size:
                  size.size ||
                  "",

                sku:
                  size.sku ||
                  "",

                stock:
                  String(
                    size.stock ??
                      0,
                  ),

                isActive:
                  size.isActive !==
                  false,
              }),
            )
          : [
              emptySize(),
            ];

      return {
        name:
          color.name ||
          "",

        hex:
          color.hex ||
          "#000000",

        images:
          normalizedImages,

        sizes,

        isActive:
          color.isActive !==
          false,
      };
    },
  );
}

/* =========================================================
   HELPERS
========================================================= */

function slugifyFolder(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,

      "-",
    )
    .replace(
      /^-+|-+$/g,

      "",
    );
}

function LoadingSpinner() {
  return (
    <span
      className="
        mx-auto
        block
        h-6
        w-6
        animate-spin
        rounded-full
        border-2
        border-[#211A18]/10
        border-t-[#8C1839]
      "
    />
  );
}

/* =========================================================
   INPUT CSS
========================================================= */

const inputClass = `
  h-[48px]
  w-full
  rounded-[12px]
  border
  border-[#211A18]/12
  bg-[#FAF8F6]
  px-4
  text-[12px]
  text-[#211A18]
  outline-none
  transition

  placeholder:text-[#211A18]/25

  focus:border-[#8C1839]
  focus:ring-4
  focus:ring-[#8C1839]/5
`;

const smallInputClass = `
  h-[42px]
  w-full
  min-w-0
  rounded-[10px]
  border
  border-[#211A18]/12
  bg-[#FAF8F6]
  px-3
  text-[10px]
  text-[#211A18]
  outline-none

  focus:border-[#8C1839]
`;