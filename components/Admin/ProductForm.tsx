"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type CategoryNode = {
  id: string;
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

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   EMPTY DATA
========================================================= */

const emptyImage = (): ImageInput => ({
  url: "",
  publicId: "",
});

const emptySize = (): SizeInput => ({
  size: "",
  sku: "",
  stock: "0",
  isActive: true,
});

const emptyColor = (): ColorInput => ({
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

export default function ProductForm() {
  /* =======================================================
     CATEGORY
  ======================================================= */

  const [
    categories,
    setCategories,
  ] = useState<CategoryNode[]>([]);

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState<string[]>([]);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  /* =======================================================
     BASIC PRODUCT
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
     MAIN IMAGES
  ======================================================= */

  const [
    mainImages,
    setMainImages,
  ] = useState<ImageInput[]>([
    emptyImage(),
    emptyImage(),
    emptyImage(),
    emptyImage(),
  ]);

  /* =======================================================
     COLOR VARIANTS
  ======================================================= */

  const [
    colors,
    setColors,
  ] = useState<ColorInput[]>([
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
      "draft"
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
     FORM STATE
  ======================================================= */

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
     LOAD CATEGORY TREE
  ========================================================= */

  useEffect(() => {
    const loadCategories =
      async () => {
        try {
          setCategoriesLoading(
            true
          );

          const response =
            await fetch(
              `${API_URL}/api/categories/tree`,
              {
                method: "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to load categories."
            );
          }

          setCategories(
            data.categories ||
              []
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load categories."
          );
        } finally {
          setCategoriesLoading(
            false
          );
        }
      };

    void loadCategories();
  }, []);

  /* =========================================================
     CATEGORY SELECT
  ========================================================= */

  const toggleCategory = (
    categoryId: string
  ) => {
    setSelectedCategories(
      (current) => {
        if (
          current.includes(
            categoryId
          )
        ) {
          return current.filter(
            (id) =>
              id !==
              categoryId
          );
        }

        return [
          ...current,
          categoryId,
        ];
      }
    );
  };

  /* =========================================================
     MAIN IMAGE
  ========================================================= */

  const setMainImage = (
    index: number,
    image: ImageInput
  ) => {
    setMainImages(
      (current) =>
        current.map(
          (
            currentImage,
            currentIndex
          ) =>
            currentIndex ===
            index
              ? image
              : currentImage
        )
    );
  };

  /* =========================================================
     COLOR
  ========================================================= */

  const addColor = () => {
    setColors(
      (current) => [
        ...current,
        emptyColor(),
      ]
    );
  };

  const removeColor = (
    colorIndex: number
  ) => {
    setColors(
      (current) =>
        current.filter(
          (
            _,
            currentIndex
          ) =>
            currentIndex !==
            colorIndex
        )
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
      | boolean
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,
            currentIndex
          ) =>
            currentIndex ===
            colorIndex
              ? {
                  ...color,
                  [field]:
                    value,
                }
              : color
        )
    );
  };

  const setColorImage = (
    colorIndex: number,
    imageIndex: number,
    image: ImageInput
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,
            currentColorIndex
          ) => {
            if (
              currentColorIndex !==
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
          }
        )
    );
  };

  /* =========================================================
     SIZE
  ========================================================= */

  const addSize = (
    colorIndex: number
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,
            currentIndex
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
              : color
        )
    );
  };

  const removeSize = (
    colorIndex: number,
    sizeIndex: number
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,
            currentIndex
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
                    currentSizeIndex
                  ) =>
                    currentSizeIndex !==
                    sizeIndex
                ),
            };
          }
        )
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
      | boolean
  ) => {
    setColors(
      (current) =>
        current.map(
          (
            color,
            currentColorIndex
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
                    currentSizeIndex
                  ) =>
                    currentSizeIndex ===
                    sizeIndex
                      ? {
                          ...size,
                          [field]:
                            value,
                        }
                      : size
                ),
            };
          }
        )
    );
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setName("");
    setShortDescription("");
    setDescription("");

    setPrice("");
    setCompareAtPrice("");
    setCostPrice("");

    setSelectedCategories(
      []
    );

    setMainImages([
      emptyImage(),
      emptyImage(),
      emptyImage(),
      emptyImage(),
    ]);

    setColors([
      emptyColor(),
    ]);

    setStatus("draft");

    setIsFeatured(false);
    setIsNewLaunch(false);

    setTags("");

    setSeoTitle("");
    setSeoDescription("");
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      setError("");
      setSuccess("");

      /* NAME */

      if (!name.trim()) {
        setError(
          "Product name is required."
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });

        return;
      }

      /* CATEGORY */

      if (
        selectedCategories.length ===
        0
      ) {
        setError(
          "Please select at least one category."
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });

        return;
      }

      /* PRICE */

      if (
        price.trim() ===
          "" ||
        Number(price) < 0 ||
        !Number.isFinite(
          Number(price)
        )
      ) {
        setError(
          "Please enter a valid selling price."
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });

        return;
      }

      try {
        setSaving(true);

        /* MAIN IMAGES */

        const cleanedMainImages =
          mainImages.filter(
            (image) =>
              image.url &&
              image.publicId
          );

        /* COLORS */

        const cleanedColors =
          colors
            .filter(
              (color) =>
                color.name.trim()
            )
            .map(
              (
                color,
                colorIndex
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
                      image.publicId
                  ),

                sizes:
                  color.sizes
                    .filter(
                      (size) =>
                        size.size.trim() &&
                        size.sku.trim()
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
                              size.stock
                            ) || 0
                          ),

                        isActive:
                          size.isActive,
                      })
                    ),
              })
            );

        /* REQUEST */

        const response =
          await fetch(
            `${API_URL}/api/products`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  name:
                    name.trim(),

                  shortDescription:
                    shortDescription.trim(),

                  description:
                    description.trim(),

                  categories:
                    selectedCategories,

                  price:
                    Number(
                      price
                    ),

                  compareAtPrice:
                    compareAtPrice
                      ? Number(
                          compareAtPrice
                        )
                      : 0,

                  costPrice:
                    costPrice
                      ? Number(
                          costPrice
                        )
                      : 0,

                  mainImages:
                    cleanedMainImages,

                  colors:
                    cleanedColors,

                  status,

                  isFeatured,

                  isNewLaunch,

                  tags:
                    tags
                      .split(",")
                      .map(
                        (tag) =>
                          tag
                            .trim()
                            .toLowerCase()
                      )
                      .filter(
                        Boolean
                      ),

                  seoTitle:
                    seoTitle.trim(),

                  seoDescription:
                    seoDescription.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to create product."
          );
        }

        setSuccess(
          "Product created successfully."
        );

        resetForm();

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to create product."
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        mx-auto
        max-w-[1500px]
      "
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

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
            Add Product
          </h2>

          <p
            className="
              mt-1
              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            Create product
            information, images,
            colors, sizes and
            inventory.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="
            flex
            h-[46px]
            items-center
            justify-center
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
            ? "Saving Product..."
            : "Save Product"}
        </button>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

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

      {/* =====================================================
          GRID
      ===================================================== */}

      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[minmax(0,1fr)_360px]
        "
      >
        {/* ===================================================
            LEFT
        =================================================== */}

        <div className="min-w-0 space-y-6">
          {/* PRODUCT DETAILS */}

          <Card title="Product Details">
            <div className="space-y-5">
              <Field
                label="Product Name"
                required
              >
                <input
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
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
                    event
                  ) =>
                    setShortDescription(
                      event.target
                        .value
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
                    event
                  ) =>
                    setDescription(
                      event.target
                        .value
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

          {/* =================================================
              PRICING
          ================================================= */}

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

          {/* =================================================
              MAIN PRODUCT IMAGES
          ================================================= */}

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
              product images. Image 1
              will be used as the main
              product card image and
              Image 2 can be shown on
              hover.
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
                  index
                ) => (
                  <ImageUploader
                    key={
                      index
                    }
                    label={`Image ${
                      index + 1
                    }`}
                    value={
                      image
                    }
                    folder="products/main"
                    onChange={(
                      uploadedImage
                    ) =>
                      setMainImage(
                        index,
                        uploadedImage
                      )
                    }
                  />
                )
              )}
            </div>
          </Card>

          {/* =================================================
              COLOR VARIANTS
          ================================================= */}

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
            <div className="space-y-5">
              {colors.map(
                (
                  color,
                  colorIndex
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
                    {/* COLOR HEADER */}

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
                              colorIndex
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
                            tracking-[0.08em]
                            text-red-500
                            transition
                            hover:bg-red-500
                            hover:text-white
                          "
                        >
                          Remove Color
                        </button>
                      )}
                    </div>

                    {/* COLOR INFO */}

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
                            event
                          ) =>
                            updateColor(
                              colorIndex,
                              "name",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="e.g. Black"
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
                              event
                            ) =>
                              updateColor(
                                colorIndex,
                                "hex",
                                event
                                  .target
                                  .value
                              )
                            }
                            className="
                              h-8
                              w-10
                              cursor-pointer
                              border-0
                              bg-transparent
                              p-0
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

                    <div className="mt-6">
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
                          Color Images
                        </p>

                        <p
                          className="
                            mt-1
                            text-[9px]
                            text-[#211A18]/35
                          "
                        >
                          Maximum 2
                          images for each
                          color.
                        </p>
                      </div>

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
                            imageIndex
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
                                  color.name
                                ) ||
                                `color-${
                                  colorIndex +
                                  1
                                }`
                              }`}
                              onChange={(
                                uploadedImage
                              ) =>
                                setColorImage(
                                  colorIndex,
                                  imageIndex,
                                  uploadedImage
                                )
                              }
                            />
                          )
                        )}
                      </div>
                    </div>

                    {/* =========================================
                        SIZE INVENTORY
                    ========================================= */}

                    <div className="mt-7">
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
                              colorIndex
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
                            tracking-[0.08em]
                            text-[#8C1839]
                            transition
                            hover:bg-[#8C1839]
                            hover:text-white
                          "
                        >
                          + Add Size
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {color.sizes
                          .length ===
                        0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              addSize(
                                colorIndex
                              )
                            }
                            className="
                              w-full
                              rounded-[13px]
                              border
                              border-dashed
                              border-[#211A18]/15
                              bg-white
                              px-4
                              py-5
                              text-[9px]
                              text-[#211A18]/45
                            "
                          >
                            + Add first
                            size
                          </button>
                        ) : (
                          color.sizes.map(
                            (
                              size,
                              sizeIndex
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
                                {/* SIZE */}

                                <input
                                  value={
                                    size.size
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateSize(
                                      colorIndex,
                                      sizeIndex,
                                      "size",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Size"
                                  className={
                                    smallInputClass
                                  }
                                />

                                {/* SKU */}

                                <input
                                  value={
                                    size.sku
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateSize(
                                      colorIndex,
                                      sizeIndex,
                                      "sku",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="SKU e.g. BRA-BLK-M"
                                  className={
                                    smallInputClass
                                  }
                                />

                                {/* STOCK */}

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={
                                    size.stock
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateSize(
                                      colorIndex,
                                      sizeIndex,
                                      "stock",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Stock"
                                  className={
                                    smallInputClass
                                  }
                                />

                                {/* ACTIVE */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSize(
                                      colorIndex,
                                      sizeIndex,
                                      "isActive",
                                      !size.isActive
                                    )
                                  }
                                  className={`
                                    h-[42px]
                                    rounded-[10px]
                                    px-3
                                    text-[8px]
                                    font-semibold
                                    uppercase
                                    transition

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

                                {/* REMOVE */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSize(
                                      colorIndex,
                                      sizeIndex
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
                                    transition
                                    hover:bg-red-50
                                  "
                                >
                                  Remove
                                </button>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>

                    {/* COLOR ACTIVE */}

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
                            text-[#211A18]
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
                          value
                        ) =>
                          updateColor(
                            colorIndex,
                            "isActive",
                            value
                          )
                        }
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>

          {/* =================================================
              SEO
          ================================================= */}

          <Card title="SEO">
            <div className="space-y-4">
              <Field label="SEO Title">
                <input
                  value={
                    seoTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setSeoTitle(
                      event.target
                        .value
                    )
                  }
                  placeholder="SEO title"
                  className={
                    inputClass
                  }
                />
              </Field>

              <Field label="SEO Description">
                <textarea
                  rows={4}
                  value={
                    seoDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setSeoDescription(
                      event.target
                        .value
                    )
                  }
                  placeholder="SEO description"
                  className={`
                    ${inputClass}
                    h-auto
                    resize-none
                    py-3
                  `}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ===================================================
            RIGHT SIDEBAR
        =================================================== */}

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
                  event
                ) =>
                  setStatus(
                    event.target
                      .value as ProductStatus
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
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </Field>

            <div className="mt-4 space-y-3">
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

          {/* =================================================
              CATEGORIES
          ================================================= */}

          <Card title="Categories">
            {categoriesLoading ? (
              <div
                className="
                  flex
                  items-center
                  gap-2
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
              <div
                className="
                  rounded-[12px]
                  bg-[#FAF8F6]
                  px-4
                  py-5
                  text-[10px]
                  leading-5
                  text-[#211A18]/45
                "
              >
                No categories found.
                Create categories from
                the Categories page
                first.
              </div>
            ) : (
              <>
                <p
                  className="
                    mb-3
                    text-[9px]
                    leading-4
                    text-[#211A18]/40
                  "
                >
                  Product can belong to
                  multiple categories and
                  subcategories.
                </p>

                <div
                  className="
                    max-h-[430px]
                    overflow-y-auto
                    pr-1
                  "
                >
                  {categories.map(
                    (
                      category
                    ) => (
                      <CategoryOption
                        key={
                          category.id
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
                    )
                  )}
                </div>
              </>
            )}
          </Card>

          {/* TAGS */}

          <Card title="Tags">
            <textarea
              value={tags}
              onChange={(
                event
              ) =>
                setTags(
                  event.target
                    .value
                )
              }
              rows={4}
              placeholder="sports bra, padded, seamless"
              className={`
                ${inputClass}
                h-auto
                resize-none
                py-3
              `}
            />

            <p
              className="
                mt-2
                text-[9px]
                leading-4
                text-[#211A18]/40
              "
            >
              Separate multiple tags
              using commas.
            </p>
          </Card>

          {/* PRODUCT SUMMARY */}

          <Card title="Product Summary">
            <div className="space-y-3">
              <SummaryRow
                label="Main Images"
                value={`${mainImages.filter(
                  (image) =>
                    image.url
                ).length}/4`}
              />

              <SummaryRow
                label="Colors"
                value={String(
                  colors.filter(
                    (color) =>
                      color.name.trim()
                  ).length
                )}
              />

              <SummaryRow
                label="Categories"
                value={String(
                  selectedCategories.length
                )}
              />

              <SummaryRow
                label="Status"
                value={
                  status
                }
              />
            </div>
          </Card>
        </div>
      </div>

      {/* =====================================================
          BOTTOM SAVE
      ===================================================== */}

      <div
        className="
          mt-7
          flex
          flex-col
          gap-3
          border-t
          border-[#211A18]/10
          pt-6
          sm:flex-row
          sm:items-center
          sm:justify-end
        "
      >
        <button
          type="submit"
          disabled={saving}
          className="
            flex
            h-[48px]
            min-w-[200px]
            items-center
            justify-center
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
            ? "Creating Product..."
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
    image: ImageInput
  ) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState("");

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setUploadError("");

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setUploadError(
          "Only JPG, PNG, WEBP or AVIF images are allowed."
        );

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        10 *
          1024 *
          1024
      ) {
        setUploadError(
          "Image must be smaller than 10MB."
        );

        event.target.value =
          "";

        return;
      }

      try {
        setUploading(true);

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        formData.append(
          "folder",
          folder
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
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Image upload failed."
          );
        }

        if (
          !data.image?.url ||
          !data.image
            ?.publicId
        ) {
          throw new Error(
            "Invalid image upload response."
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
            : "Image upload failed."
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

  /* =======================================================
     REMOVE
  ======================================================= */

  const removeImage = () => {
    onChange({
      url: "",
      publicId: "",
    });

    setUploadError("");
  };

  return (
    <div
      className="
        min-w-0
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
          gap-2
        "
      >
        <p
          className="
            text-[10px]
            font-semibold
            text-[#211A18]
          "
        >
          {label}
        </p>

        {value.url && (
          <button
            type="button"
            onClick={
              removeImage
            }
            className="
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.08em]
              text-red-500
            "
          >
            Remove
          </button>
        )}
      </div>

      {/* PREVIEW */}

      {value.url ? (
        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[13px]
            border
            border-[#211A18]/10
            bg-white
          "
        >
          <div
            className="
              relative
              aspect-[4/5]
              overflow-hidden
              bg-[#EFE9E4]
            "
          >
            <img
              src={
                value.url
              }
              alt={label}
              className="
                h-full
                w-full
                object-cover
                object-center
              "
            />

            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black/0
                opacity-0
                transition-all
                duration-200

                group-hover:bg-black/35
                group-hover:opacity-100
              "
            >
              <button
                type="button"
                onClick={() =>
                  inputRef.current?.click()
                }
                disabled={
                  uploading
                }
                className="
                  rounded-[10px]
                  bg-white
                  px-4
                  py-3
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.08em]
                  text-[#211A18]
                "
              >
                {uploading
                  ? "Uploading..."
                  : "Replace"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={
            uploading
          }
          className="
            flex
            aspect-[4/5]
            w-full
            flex-col
            items-center
            justify-center
            rounded-[13px]
            border
            border-dashed
            border-[#211A18]/20
            bg-white
            px-4
            text-center
            transition

            hover:border-[#8C1839]
            hover:bg-[#FFF9FA]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {uploading ? (
            <>
              <LoadingSpinner />

              <span
                className="
                  mt-3
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]/50
                "
              >
                Uploading...
              </span>
            </>
          ) : (
            <>
              <UploadIcon />

              <span
                className="
                  mt-3
                  text-[10px]
                  font-semibold
                  text-[#211A18]
                "
              >
                Choose Image
              </span>

              <span
                className="
                  mt-1
                  text-[8px]
                  leading-4
                  text-[#211A18]/40
                "
              >
                JPG, PNG, WEBP,
                AVIF
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
            mt-3
            text-[8px]
            leading-4
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
   CATEGORY OPTION
========================================================= */

function CategoryOption({
  category,
  selected,
  toggle,
}: {
  category: CategoryNode;

  selected: string[];

  toggle: (
    id: string
  ) => void;
}) {
  return (
    <>
      <label
        className="
          mb-1
          flex
          cursor-pointer
          items-center
          gap-2.5
          rounded-[9px]
          py-2
          pr-2
          text-[10px]
          text-[#211A18]
          transition

          hover:bg-[#FAF8F6]
        "
        style={{
          paddingLeft:
            8 +
            category.level *
              14,
        }}
      >
        <input
          type="checkbox"
          checked={selected.includes(
            category.id
          )}
          onChange={() =>
            toggle(
              category.id
            )
          }
          className="
            h-4
            w-4
            shrink-0
            accent-[#8C1839]
          "
        />

        <span className="min-w-0 truncate">
          {category.name}
        </span>
      </label>

      {category.children?.map(
        (child) => (
          <CategoryOption
            key={child.id}
            category={child}
            selected={
              selected
            }
            toggle={
              toggle
            }
          />
        )
      )}
    </>
  );
}

/* =========================================================
   CARD
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
        min-w-0
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
            text-[#211A18]
          "
        >
          {title}
        </h3>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required = false,
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

/* =========================================================
   CURRENCY INPUT
========================================================= */

function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;

  onChange: (
    value: string
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
        transition

        focus-within:border-[#8C1839]
        focus-within:ring-4
        focus-within:ring-[#8C1839]/5
      "
    >
      <span
        className="
          flex
          h-full
          items-center
          border-r
          border-[#211A18]/10
          px-3
          text-[13px]
          font-semibold
          text-[#211A18]/55
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
          event
        ) =>
          onChange(
            event.target.value
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
          text-[#211A18]
          outline-none
          placeholder:text-[#211A18]/25
        "
      />
    </div>
  );
}

/* =========================================================
   TOGGLE ROW
========================================================= */

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
    value: boolean
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
            text-[#211A18]
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
        checked={
          checked
        }
        onChange={
          onChange
        }
      />
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;

  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
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

/* =========================================================
   SUMMARY
========================================================= */

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
          text-[#211A18]
        "
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

const slugifyFolder = (
  value: string
): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
};

/* =========================================================
   ICONS
========================================================= */

function UploadIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="
        text-[#8C1839]
      "
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <span
      className="
        block
        h-5
        w-5
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
   STYLES
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
  transition

  placeholder:text-[#211A18]/25

  focus:border-[#8C1839]
  focus:ring-2
  focus:ring-[#8C1839]/5
`;