"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProductImagesUploader, {
  type ImageValue,
} from "@/components/Admin/ProductImagesUploader";

import HtmlDescriptionEditor from "@/components/Admin/HtmlDescriptionEditor";

type ProductFormProps = {
  mode?: "create" | "edit";
  productId?: string;
};

type CategoryNode = {
  id?: string;
  _id?: string;
  name: string;
  level?: number;
  children?: CategoryNode[];
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
  isDefault: boolean;
  nameProduct: string;
  slugProduct: string;
  shortDescription: string;
  description: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  images: ImageValue[];
  sizes: SizeInput[];
  isActive: boolean;
};

type ProductStatus =
  | "draft"
  | "active"
  | "inactive";

type ProductApiData = {
  name?: string;
  slug?: string;
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
  stock?: number;
  mainImages?: ImageValue[];
  isColor?: boolean;
  isActive?: boolean;
  colors?: Array<{
    name?: string;
    nameColor?: string;
    slugColor?: string;
    nameProduct?: string;
    slugProduct?: string;
    hex?: string;
    isDefault?: boolean;
    shortDescription?: string;
    description?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    images?: ImageValue[];
    sizes?: Array<{
      size?: string;
      sku?: string;
      stock?: number;
      isActive?: boolean;
    }>;
    isActive?: boolean;
  }>;
  ratings?: {
    average?: number;
    count?: number;
  };
  status?: ProductStatus;
  isFeatured?: boolean;
  isNewLaunch?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const emptyImage =
  (): ImageValue => ({
    url: "",
    publicId: "",
    name: "",
    alt: "",
    isDefault: false,
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
    isDefault: false,
    nameProduct: "",
    slugProduct: "",
    shortDescription: "",
    description: "",
    tags: "",
    seoTitle: "",
    seoDescription: "",
    images: [],
    sizes: [
      emptySize(),
    ],
    isActive: true,
  });

export default function ProductForm({
  mode = "create",
  productId,
}: ProductFormProps) {
  const router =
    useRouter();

  const isEdit =
    mode === "edit";

  const [
    categories,
    setCategories,
  ] =
    useState<CategoryNode[]>(
      []
    );

  const [
    selectedCategories,
    setSelectedCategories,
  ] =
    useState<string[]>(
      []
    );

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] =
    useState(true);

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    slug,
    setSlug,
  ] =
    useState("");

  /*
    Create mode:
    product name se slug auto-suggest hota rahega
    jab tak admin slug field manually edit nahi karta.
  */
  const slugTouchedRef =
    useRef(false);

  const [
    shortDescription,
    setShortDescription,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    price,
    setPrice,
  ] =
    useState("");

  const [
    compareAtPrice,
    setCompareAtPrice,
  ] =
    useState("");

  const [
    costPrice,
    setCostPrice,
  ] =
    useState("");

  /*
    Single product-level stock.
    Existing variant/size stock stays unchanged.
  */
  const [
    stock,
    setStock,
  ] =
    useState("0");

  const [
    mainImages,
    setMainImages,
  ] =
    useState<ImageValue[]>(
      []
    );

  const [
    isColor,
    setIsColor,
  ] =
    useState(false);

  const [
    colors,
    setColors,
  ] =
    useState<ColorInput[]>(
      []
    );

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
  ] =
    useState(false);

  const [
    isNewLaunch,
    setIsNewLaunch,
  ] =
    useState(false);

  const [
    ratingAverage,
    setRatingAverage,
  ] =
    useState(0);

  const [
    ratingCount,
    setRatingCount,
  ] =
    useState(0);

  const [
    tags,
    setTags,
  ] =
    useState("");

  const [
    seoTitle,
    setSeoTitle,
  ] =
    useState("");

  const [
    seoDescription,
    setSeoDescription,
  ] =
    useState("");

  const [
    productLoading,
    setProductLoading,
  ] =
    useState(isEdit);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /*
    Only images uploaded during
    this unsaved form session.
  */
  const newUploadIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const savedRef =
    useRef(false);

  const deleteCloudinaryImage =
    useCallback(
      async (
        publicId: string
      ) => {
        if (!publicId) {
          return;
        }

        const response =
          await fetch(
            `${API_URL}/api/uploads/image`,
            {
              method: "DELETE",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  publicId,
                }),
            }
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          throw new Error(
            data.message ||
              "Unable to delete image."
          );
        }
      },
      []
    );

  const cleanupUnsavedUploads =
    useCallback(
      async () => {
        const ids =
          Array.from(
            newUploadIdsRef.current
          );

        await Promise.allSettled(
          ids.map(
            (
              publicId
            ) =>
              deleteCloudinaryImage(
                publicId
              )
          )
        );

        newUploadIdsRef.current.clear();
      },
      [
        deleteCloudinaryImage,
      ]
    );

  useEffect(
    () => {
      return () => {
        if (
          savedRef.current
        ) {
          return;
        }

        for (
          const publicId
          of Array.from(
            newUploadIdsRef.current
          )
        ) {
          void fetch(
            `${API_URL}/api/uploads/image`,
            {
              method: "DELETE",
              credentials:
                "include",
              keepalive: true,
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  publicId,
                }),
            }
          );
        }
      };
    },
    []
  );

  useEffect(
    () => {
      let cancelled =
        false;

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

            if (!cancelled) {
              setCategories(
                Array.isArray(
                  data.categories
                )
                  ? data.categories
                  : []
              );
            }
          } catch (error) {
            if (!cancelled) {
              setError(
                error instanceof
                  Error
                  ? error.message
                  : "Unable to load categories."
              );
            }
          } finally {
            if (!cancelled) {
              setCategoriesLoading(
                false
              );
            }
          }
        };

      void loadCategories();

      return () => {
        cancelled =
          true;
      };
    },
    []
  );

  useEffect(
    () => {
      if (!isEdit) {
        setProductLoading(
          false
        );
        return;
      }

      if (!productId) {
        setError(
          "Product ID is missing."
        );
        setProductLoading(
          false
        );
        return;
      }

      let cancelled =
        false;

      const loadProduct =
        async () => {
          try {
            setProductLoading(
              true
            );

            const response =
              await fetch(
                `${API_URL}/api/products/${productId}`,
                {
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
                  "Unable to load product."
              );
            }

            if (cancelled) {
              return;
            }

            const product:
              ProductApiData =
              data.product ||
              data;

            setName(
              product.name ||
                ""
            );

            setSlug(
              product.slug ||
                ""
            );

            slugTouchedRef.current =
              true;

            setShortDescription(
              product.shortDescription ||
                ""
            );

            setDescription(
              product.description ||
                ""
            );

            setPrice(
              product.price !==
                undefined
                ? String(
                    product.price
                  )
                : ""
            );

            setCompareAtPrice(
              product.compareAtPrice !==
                undefined
                ? String(
                    product.compareAtPrice
                  )
                : ""
            );

            setCostPrice(
              product.costPrice !==
                undefined
                ? String(
                    product.costPrice
                  )
                : ""
            );

            setStock(
              product.stock !==
                undefined
                ? String(
                    product.stock
                  )
                : "0"
            );

            setSelectedCategories(
              (
                product.categories ||
                []
              )
                .map(
                  (
                    category
                  ) =>
                    typeof category ===
                    "string"
                      ? category
                      : (
                          category.id ||
                          category._id ||
                          ""
                        )
                )
                .filter(
                  Boolean
                )
            );

            setMainImages(
              normalizeMainImages(
                product.mainImages ||
                  []
              )
            );

            const productHasColors =
              product.isColor ===
                true ||
              (
                Array.isArray(
                  product.colors
                ) &&
                product.colors.length >
                  0
              );

            setIsColor(
              productHasColors
            );

            setColors(
              productHasColors
                ? normalizeColors(
                    product.colors ||
                      []
                  )
                : []
            );

            setRatingAverage(
              Number(
                product.ratings
                  ?.average ||
                  0
              )
            );

            setRatingCount(
              Number(
                product.ratings
                  ?.count ||
                  0
              )
            );

            setStatus(
              product.status ||
                "draft"
            );

            setIsFeatured(
              Boolean(
                product.isFeatured
              )
            );

            setIsNewLaunch(
              Boolean(
                product.isNewLaunch
              )
            );

            setTags(
              Array.isArray(
                product.tags
              )
                ? product.tags.join(
                    ", "
                  )
                : ""
            );

            setSeoTitle(
              product.seoTitle ||
                ""
            );

            setSeoDescription(
              product.seoDescription ||
                ""
            );
          } catch (error) {
            if (!cancelled) {
              setError(
                error instanceof
                  Error
                  ? error.message
                  : "Unable to load product."
              );
            }
          } finally {
            if (!cancelled) {
              setProductLoading(
                false
              );
            }
          }
        };

      void loadProduct();

      return () => {
        cancelled =
          true;
      };
    },
    [
      isEdit,
      productId,
    ]
  );

  const productFolderName =
    useMemo(
      () =>
        slugifyFolder(
          name
        ) ||
        (
          productId
            ? `product-${productId}`
            : "new-product"
        ),
      [
        name,
        productId,
      ]
    );

  const toggleCategory =
    (
      categoryId: string
    ) => {
      setSelectedCategories(
        (
          current
        ) =>
          current.includes(
            categoryId
          )
            ? current.filter(
                (
                  id
                ) =>
                  id !==
                  categoryId
              )
            : [
                ...current,
                categoryId,
              ]
      );
    };

  const registerNewUpload =
    (
      image: ImageValue
    ) => {
      if (image.publicId) {
        newUploadIdsRef.current.add(
          image.publicId
        );
      }
    };

  const removeUnsavedImage =
    async (
      image: ImageValue
    ) => {
      if (
        !image.publicId ||
        !newUploadIdsRef.current.has(
          image.publicId
        )
      ) {
        return;
      }

      await deleteCloudinaryImage(
        image.publicId
      );

      newUploadIdsRef.current.delete(
        image.publicId
      );
    };

  const onMainImagesUploaded =
    (
      uploadedImages: ImageValue[]
    ) => {
      for (
        const image
        of uploadedImages
      ) {
        registerNewUpload(
          image
        );
      }

      setMainImages(
        (
          current
        ) => [
          ...current,
          ...uploadedImages,
        ]
      );
    };

  const removeMainImage =
    async (
      index: number
    ) => {
      const oldImage =
        mainImages[
          index
        ];

      if (!oldImage) {
        return;
      }

      if (
        newUploadIdsRef.current.has(
          oldImage.publicId
        )
      ) {
        await removeUnsavedImage(
          oldImage
        );
      }

      /*
        Existing DB image:
        remove only from state.
        Backend PATCH compares old/new image publicIds
        and deletes removed Cloudinary images after save.
      */
      setMainImages(
        (
          current
        ) =>
          current.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          )
      );
    };

  const makeMainImage =
    (
      index: number
    ) => {
      setMainImages(
        (
          current
        ) => {
          if (
            index <= 0 ||
            index >= current.length
          ) {
            return current;
          }

          const next =
            [
              ...current,
            ];

          const [image] =
            next.splice(
              index,
              1
            );

          next.unshift(
            image
          );

          return next;
        }
      );
    };

  const updateMainImage =
    (
      imageIndex: number,
      patch: Partial<Pick<ImageValue, "name" | "alt">>
    ) => {
      setMainImages(
        current =>
          current.map(
            (image, index) =>
              index === imageIndex
                ? {
                    ...image,
                    ...patch,
                  }
                : image
          )
      );
    };

  const handleColorModeChange =
    async (
      enabled: boolean
    ) => {
      if (enabled) {
        /*
          In color mode images live only in colors[].images[].
          Remove unsaved main-gallery uploads now; existing saved
          main images are deleted by backend after the product save.
        */
        for (const image of mainImages) {
          if (
            newUploadIdsRef.current.has(
              image.publicId
            )
          ) {
            await removeUnsavedImage(
              image
            );
          }
        }

        setMainImages([]);
        setIsColor(true);

        setColors(
          current =>
            current.length > 0
              ? current
              : [
                  {
                    ...emptyColor(),
                    isDefault: true,
                  },
                ]
        );

        return;
      }

      /*
        Newly uploaded unsaved color images are not known to MongoDB,
        so delete them immediately before color mode is switched off.
        Existing saved images are deleted by the backend after PATCH.
      */
      for (const color of colors) {
        for (const image of color.images) {
          if (
            newUploadIdsRef.current.has(
              image.publicId
            )
          ) {
            await removeUnsavedImage(
              image
            );
          }
        }
      }

      setColors([]);
      setIsColor(false);
    };

  const addColor =
    () => {
      if (!isColor) {
        return;
      }

      setColors(
        (
          current
        ) => [
          ...current,
          emptyColor(),
        ]
      );
    };

  const removeColor =
    async (
      colorIndex: number
    ) => {
      const color =
        colors[
          colorIndex
        ];

      for (
        const image
        of color.images
      ) {
        if (
          newUploadIdsRef.current.has(
            image.publicId
          )
        ) {
          await removeUnsavedImage(
            image
          );
        }
      }

      setColors(
        (
          current
        ) =>
          current.filter(
            (
              _,
              index
            ) =>
              index !==
              colorIndex
          )
      );
    };

  const updateColor =
    (
      colorIndex: number,
      field:
        | "name"
        | "hex"
        | "isDefault"
        | "nameProduct"
        | "slugProduct"
        | "shortDescription"
        | "description"
        | "tags"
        | "seoTitle"
        | "seoDescription"
        | "isActive",
      value:
        | string
        | boolean
    ) => {
      setColors(
        current =>
          current.map(
            (color, index) => {
              if (field === "isDefault") {
                return {
                  ...color,
                  isDefault:
                    index === colorIndex
                      ? Boolean(value)
                      : Boolean(value)
                        ? false
                        : color.isDefault,
                };
              }

              return index === colorIndex
                ? {
                    ...color,
                    [field]: value,
                  }
                : color;
            }
          )
      );
    };

  const onColorImagesUploaded =
    (
      colorIndex: number,
      uploadedImages: ImageValue[]
    ) => {
      for (
        const image
        of uploadedImages
      ) {
        registerNewUpload(
          image
        );
      }

      setColors(
        (
          current
        ) =>
          current.map(
            (
              color,
              index
            ) =>
              index ===
              colorIndex
                ? {
                    ...color,
                    images: [
                      ...color.images,
                      ...uploadedImages,
                    ],
                  }
                : color
          )
      );
    };

  const updateColorImage =
    (
      colorIndex: number,
      imageIndex: number,
      patch: Partial<Pick<ImageValue, "name" | "alt">>
    ) => {
      setColors(
        current =>
          current.map(
            (color, index) =>
              index === colorIndex
                ? {
                    ...color,
                    images:
                      color.images.map(
                        (image, currentImageIndex) =>
                          currentImageIndex === imageIndex
                            ? {
                                ...image,
                                ...patch,
                              }
                            : image
                      ),
                  }
                : color
          )
      );
    };

  const removeColorImage =
    async (
      colorIndex: number,
      imageIndex: number
    ) => {
      const oldImage =
        colors[
          colorIndex
        ]?.images[
          imageIndex
        ];

      if (!oldImage) {
        return;
      }

      if (
        newUploadIdsRef.current.has(
          oldImage.publicId
        )
      ) {
        await removeUnsavedImage(
          oldImage
        );
      }

      setColors(
        (
          current
        ) =>
          current.map(
            (
              color,
              index
            ) => {
              if (
                index !==
                colorIndex
              ) {
                return color;
              }

              return {
                ...color,
                images:
                  color.images.filter(
                    (
                      _,
                      currentImageIndex
                    ) =>
                      currentImageIndex !==
                      imageIndex
                  ),
              };
            }
          )
      );
    };

  const makeColorMainImage =
    (
      colorIndex: number,
      imageIndex: number
    ) => {
      setColors(
        (
          current
        ) =>
          current.map(
            (
              color,
              index
            ) => {
              if (
                index !==
                  colorIndex ||
                imageIndex <= 0 ||
                imageIndex >=
                  color.images.length
              ) {
                return color;
              }

              const images =
                [
                  ...color.images,
                ];

              const [image] =
                images.splice(
                  imageIndex,
                  1
                );

              images.unshift(
                image
              );

              return {
                ...color,
                images,
              };
            }
          )
      );
    };

  const addSize =
    (
      colorIndex: number
    ) => {
      setColors(
        (
          current
        ) =>
          current.map(
            (
              color,
              index
            ) =>
              index ===
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

  const removeSize =
    (
      colorIndex: number,
      sizeIndex: number
    ) => {
      setColors(
        (
          current
        ) =>
          current.map(
            (
              color,
              index
            ) =>
              index ===
              colorIndex
                ? {
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
                  }
                : color
          )
      );
    };

  const updateSize =
    (
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
        (
          current
        ) =>
          current.map(
            (
              color,
              index
            ) => {
              if (
                index !==
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

      if (!name.trim()) {
        setError(
          "Product name is required."
        );
        return;
      }

      if (
        !slug.trim()
      ) {
        setError(
          "Product slug is required."
        );
        return;
      }

      if (
        selectedCategories.length ===
        0
      ) {
        setError(
          "Please select at least one category."
        );
        return;
      }

      if (
        price.trim() ===
          "" ||
        !Number.isFinite(
          Number(
            price
          )
        ) ||
        Number(
          price
        ) <
          0
      ) {
        setError(
          "Please enter a valid price."
        );
        return;
      }

      if (
        stock.trim() ===
          "" ||
        !Number.isInteger(
          Number(
            stock
          )
        ) ||
        Number(
          stock
        ) <
          0
      ) {
        setError(
          "Please enter a valid stock quantity (0 or greater)."
        );
        return;
      }

      if (isColor) {
        const submittedColors =
          colors.filter(
            color =>
              color.name.trim()
          );

        if (
          submittedColors.length ===
          0
        ) {
          setError(
            "At least one color variant is required when Color Variants is enabled."
          );
          return;
        }

        const missingProductName =
          submittedColors.find(
            color =>
              !color.nameProduct.trim()
          );

        if (missingProductName) {
          setError(
            `Color product name is required for ${missingProductName.name || "every color"}.`
          );
          return;
        }
      }

      try {
        setSaving(true);

        const payload = {
          name:
            name.trim(),

          slug:
            slug.trim(),

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
            compareAtPrice.trim()
              ? Number(
                  compareAtPrice
                )
              : 0,

          costPrice:
            costPrice.trim()
              ? Number(
                  costPrice
                )
              : 0,

          stock:
            Number(
              stock
            ),

          isColor,

          mainImages:
            isColor
              ? []
              : mainImages
              .filter(
                image =>
                  image.url &&
                  image.publicId
              )
              .map((image, index) => ({
                ...image,
                name:
                  image.name?.trim() ||
                  image.alt?.trim() ||
                  `product-image-${index + 1}`,
                alt:
                  image.alt?.trim() ||
                  image.name?.trim() ||
                  name.trim(),
                isDefault:
                  index === 0,
              })),

          colors:
            isColor
              ? colors
              .filter(
                (
                  color
                ) =>
                  color.name.trim()
              )
              .map(
                (
                  color,
                  colorIndex
                ) => ({
                  name:
                    color.name.trim(),

                  nameColor:
                    color.name.trim(),

                  slugColor:
                    slugifyProductSlug(
                      color.name
                    ),

                  nameProduct:
                    color.nameProduct.trim() ||
                    name.trim(),

                  slugProduct:
                    color.slugProduct.trim(),

                  hex:
                    color.hex.trim(),

                  isDefault:
                    color.isDefault,

                  shortDescription:
                    color.shortDescription.trim(),

                  description:
                    color.description.trim(),

                  tags:
                    color.tags
                      .split(",")
                      .map(tag =>
                        tag.trim().toLowerCase()
                      )
                      .filter(Boolean),

                  seoTitle:
                    color.seoTitle.trim(),

                  seoDescription:
                    color.seoDescription.trim(),

                  sortOrder:
                    colorIndex,

                  isActive:
                    color.isActive,

                  images:
                    color.images
                      .filter(
                        image =>
                          image.url &&
                          image.publicId
                      )
                      .map((image, imageIndex) => ({
                        ...image,
                        name:
                          image.name?.trim() ||
                          image.alt?.trim() ||
                          `${slugifyFolder(color.name) || "color"}-image-${imageIndex + 1}`,
                        alt:
                          image.alt?.trim() ||
                          image.name?.trim() ||
                          color.nameProduct.trim() ||
                          name.trim(),
                        isDefault:
                          imageIndex === 0,
                      })),

                  sizes:
                    color.sizes
                      .filter(
                        (
                          size
                        ) =>
                          size.size.trim() &&
                          size.sku.trim()
                      )
                      .map(
                        (
                          size
                        ) => ({
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
                              Math.floor(
                                Number(
                                  size.stock
                                ) ||
                                  0
                              )
                            ),

                          isActive:
                            size.isActive,
                        })
                      ),
                })
              )
              : [],

          status,

          isFeatured,

          isNewLaunch,

          tags:
            tags
              .split(",")
              .map(
                (
                  tag
                ) =>
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
        };

        const endpoint =
          isEdit
            ? `${API_URL}/api/products/${productId}`
            : `${API_URL}/api/products`;

        const response =
          await fetch(
            endpoint,
            {
              method:
                isEdit
                  ? "PATCH"
                  : "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              (
                isEdit
                  ? "Unable to update product."
                  : "Unable to create product."
              )
          );
        }

        newUploadIdsRef.current.clear();

        savedRef.current =
          true;

        setSuccess(
          isEdit
            ? "Product updated successfully."
            : "Product created successfully."
        );

        window.setTimeout(
          () => {
            router.push(
              "/admin/products"
            );
            router.refresh();
          },
          500
        );
      } catch (error) {
        setError(
          error instanceof
            Error
            ? error.message
            : "Unable to save product."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleCancel =
    async () => {
      setSaving(true);

      await cleanupUnsavedUploads();

      setSaving(false);

      router.push(
        "/admin/products"
      );
    };

  if (
    productLoading
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#211A18]/10 bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mx-auto max-w-[1500px]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8C1839]">
            Catalog Management
          </p>

          <h1 className="mt-2 text-[28px] font-semibold text-[#211A18]">
            {isEdit
              ? "Edit Product"
              : "Add Product"}
          </h1>

          <p className="mt-1 text-[11px] text-[#211A18]/45">
            Product details, media,
            pricing, colors, sizes,
            stock and publishing.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              void handleCancel()
            }
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-5 text-[9px] font-semibold uppercase disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="h-11 rounded-xl bg-[#8C1839] px-6 text-[9px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#211A18] disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Update Product"
                : "Create Product"}
          </button>
        </div>
      </div>

      {error && (
        <Message tone="error">
          {error}
        </Message>
      )}

      {success && (
        <Message tone="success">
          {success}
        </Message>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Product Details">
            <div className="space-y-4">
              <Field
                label="Product Name"
                required
              >
                <input
                  value={name}
                  onChange={(
                    event
                  ) => {
                    const nextName =
                      event.target.value;

                    setName(
                      nextName
                    );

                    if (
                      !slugTouchedRef.current
                    ) {
                      setSlug(
                        slugifyProductSlug(
                          nextName
                        )
                      );
                    }
                  }}
                  className={
                    inputClass
                  }
                  placeholder="Everyday Sports Bra"
                />
              </Field>

              <Field
                label="Product Slug"
                required
              >
                <input
                  value={slug}
                  onChange={(
                    event
                  ) => {
                    slugTouchedRef.current =
                      true;

                    setSlug(
                      event.target.value
                    );
                  }}
                  className={
                    inputClass
                  }
                  placeholder="coral-red-maternity-bra"
                />

                <p className="mt-2 text-[8px] leading-4 text-[#211A18]/40">
                  Admin kuch bhi readable value type kar sakta hai. Backend ise safe URL slug me convert karega. Example: <b>Coral Red Bra 2026</b> → <b>coral-red-bra-2026</b>.
                </p>
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
                      event.target.value
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="Short listing description"
                />
              </Field>

              <Field label="Description (HTML + Inline CSS)">
                <HtmlDescriptionEditor
                  value={description}
                  onChange={setDescription}
                  disabled={saving}
                />
              </Field>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Selling Price"
                required
              >
                <MoneyInput
                  value={price}
                  setValue={
                    setPrice
                  }
                />
              </Field>

              <Field label="Compare At Price">
                <MoneyInput
                  value={
                    compareAtPrice
                  }
                  setValue={
                    setCompareAtPrice
                  }
                />
              </Field>

              <Field label="Cost Price">
                <MoneyInput
                  value={
                    costPrice
                  }
                  setValue={
                    setCostPrice
                  }
                />
              </Field>

              <Field
                label="Stock"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(
                    event
                  ) =>
                    setStock(
                      event.target.value
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="0"
                />
              </Field>
            </div>
          </Card>

          {!isColor && (
            <Card title="Main Product Images">
              <p className="mb-4 text-[9px] leading-5 text-[#211A18]/40">
                No fixed image limit. These images are used only when Color Variants is OFF.
              </p>

              <ProductImagesUploader
                label="Product Gallery"
                value={mainImages}
                folder={`products/${productFolderName}/main`}
                disabled={saving}
                onUploaded={onMainImagesUploaded}
                onRemove={removeMainImage}
                onMakeMain={makeMainImage}
                onUpdate={updateMainImage}
              />
            </Card>
          )}

          {isColor && (
          <Card
            title="Color Variants"
            action={
              <button
                type="button"
                onClick={
                  addColor
                }
                className="rounded-lg bg-[#211A18] px-4 py-2 text-[8px] font-semibold uppercase text-white"
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
                    className="rounded-2xl border border-[#211A18]/10 bg-[#FAF8F6] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold">
                        Color{" "}
                        {colorIndex + 1}
                      </p>

                      {colors.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            void removeColor(
                              colorIndex
                            )
                          }
                          className="text-[8px] font-semibold uppercase text-red-500"
                        >
                          Remove Color
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_150px]">
                      <Field label="Color Name">
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
                              event.target.value
                            )
                          }
                          className={
                            inputClass
                          }
                          placeholder="Black"
                        />
                      </Field>

                      <Field label="Hex">
                        <div className="flex h-12 items-center gap-3 rounded-xl border border-[#211A18]/10 bg-white px-3">
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
                                event.target.value
                              )
                            }
                          />

                          <span className="text-[9px] uppercase">
                            {color.hex}
                          </span>
                        </div>
                      </Field>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Color Product Name">
                        <input
                          value={color.nameProduct}
                          onChange={(event) =>
                            updateColor(
                              colorIndex,
                              "nameProduct",
                              event.target.value
                            )
                          }
                          className={inputClass}
                          placeholder={name || "Black Bikini Panty For Women"}
                        />
                      </Field>

                      <Field label="Color Product Slug">
                        <input
                          value={color.slugProduct}
                          onChange={(event) =>
                            updateColor(
                              colorIndex,
                              "slugProduct",
                              event.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="black-bikini-panty-for-women"
                        />
                      </Field>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Color Short Description">
                        <textarea
                          value={color.shortDescription}
                          onChange={(event) =>
                            updateColor(
                              colorIndex,
                              "shortDescription",
                              event.target.value
                            )
                          }
                          rows={3}
                          className={`${inputClass} h-auto py-3`}
                          placeholder="Description for this color variant"
                        />
                      </Field>

                      <Field label="Color Tags (comma separated)">
                        <textarea
                          value={color.tags}
                          onChange={(event) =>
                            updateColor(
                              colorIndex,
                              "tags",
                              event.target.value
                            )
                          }
                          rows={3}
                          className={`${inputClass} h-auto py-3`}
                          placeholder="women, bikini panty, black panty"
                        />
                      </Field>
                    </div>

                    <div className="mt-4">
                      <Field label="Color Description (HTML + Inline CSS)">
                        <HtmlDescriptionEditor
                          value={color.description}
                          onChange={(value) =>
                            updateColor(
                              colorIndex,
                              "description",
                              value
                            )
                          }
                          disabled={saving}
                        />
                      </Field>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Color SEO Title">
                        <input
                          value={color.seoTitle}
                          onChange={(event) =>
                            updateColor(
                              colorIndex,
                              "seoTitle",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Color SEO Description">
                        <textarea
                          value={color.seoDescription}
                          onChange={(event) =>
                            updateColor(
                              colorIndex,
                              "seoDescription",
                              event.target.value
                            )
                          }
                          rows={3}
                          className={`${inputClass} h-auto py-3`}
                        />
                      </Field>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3">
                      <div>
                        <p className="text-[10px] font-semibold">Default Color</p>
                        <p className="mt-1 text-[8px] text-[#211A18]/40">This color is used as the default storefront variant.</p>
                      </div>
                      <Toggle
                        checked={color.isDefault}
                        onChange={(value) =>
                          updateColor(
                            colorIndex,
                            "isDefault",
                            value
                          )
                        }
                      />
                    </div>

                    <div className="mt-5">
                      <ProductImagesUploader
                        label="Color Images"
                        value={color.images}
                        folder={`products/${productFolderName}/colors/${
                          slugifyFolder(
                            color.name
                          ) ||
                          `color-${colorIndex + 1}`
                        }`}
                        disabled={saving}
                        onUploaded={(uploadedImages) =>
                          onColorImagesUploaded(
                            colorIndex,
                            uploadedImages
                          )
                        }
                        onRemove={(imageIndex) =>
                          removeColorImage(
                            colorIndex,
                            imageIndex
                          )
                        }
                        onMakeMain={(imageIndex) =>
                          makeColorMainImage(
                            colorIndex,
                            imageIndex
                          )
                        }
                        onUpdate={(imageIndex, patch) =>
                          updateColorImage(
                            colorIndex,
                            imageIndex,
                            patch
                          )
                        }
                      />
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#211A18]/50">
                        Sizes & Inventory
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          addSize(
                            colorIndex
                          )
                        }
                        className="rounded-lg border border-[#8C1839]/20 px-3 py-2 text-[8px] font-semibold uppercase text-[#8C1839]"
                      >
                        + Add Size
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {color.sizes.map(
                        (
                          size,
                          sizeIndex
                        ) => (
                          <div
                            key={
                              sizeIndex
                            }
                            className="grid grid-cols-1 gap-3 rounded-xl border border-[#211A18]/10 bg-white p-3 md:grid-cols-[100px_minmax(140px,1fr)_110px_80px_auto] md:items-center"
                          >
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
                                  event.target.value
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
                                event
                              ) =>
                                updateSize(
                                  colorIndex,
                                  sizeIndex,
                                  "sku",
                                  event.target.value
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
                                event
                              ) =>
                                updateSize(
                                  colorIndex,
                                  sizeIndex,
                                  "stock",
                                  event.target.value
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
                                  !size.isActive
                                )
                              }
                              className={`h-10 rounded-lg text-[8px] font-semibold uppercase ${
                                size.isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-[#211A18]/5 text-[#211A18]/40"
                              }`}
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
                                  sizeIndex
                                )
                              }
                              className="h-10 rounded-lg px-3 text-[8px] font-semibold uppercase text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3">
                      <div>
                        <p className="text-[10px] font-semibold">
                          Active Color
                        </p>
                        <p className="mt-1 text-[8px] text-[#211A18]/40">
                          Show to customers
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
          )}

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
                      event.target.value
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Field>

              <Field label="SEO Description">
                <textarea
                  value={
                    seoDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setSeoDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  className={`${inputClass} h-auto py-3`}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-[100px] xl:h-fit">
          <Card title="Publishing">
            <div className="mb-4 flex items-center justify-between rounded-xl bg-[#FAF8F6] p-3">
              <div>
                <p className="text-[10px] font-semibold">Color Variants</p>
                <p className="mt-1 text-[8px] text-[#211A18]/40">Enable color-wise product name, slug, SEO, images and sizes.</p>
              </div>
              <Toggle
                checked={isColor}
                onChange={(value) =>
                  void handleColorModeChange(
                    value
                  )
                }
              />
            </div>

            <Field label="Status">
              <select
                value={
                  status
                }
                onChange={(
                  event
                ) =>
                  setStatus(
                    event.target.value as
                      ProductStatus
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

            <div className="mt-4 space-y-3">
              <ToggleRow
                label="Featured Product"
                checked={
                  isFeatured
                }
                onChange={
                  setIsFeatured
                }
              />

              <ToggleRow
                label="New Launch"
                checked={
                  isNewLaunch
                }
                onChange={
                  setIsNewLaunch
                }
              />
            </div>
          </Card>

          <Card title="Categories">
            {categoriesLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                {categories.map(
                  (
                    category
                  ) => (
                    <CategoryOption
                      key={
                        getCategoryId(
                          category
                        )
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
            )}
          </Card>

          {isEdit && (
            <Card title="Ratings">
              <div className="rounded-xl bg-[#FAF8F6] p-4">
                <p className="text-2xl font-semibold">
                  {ratingAverage.toFixed(
                    1
                  )}{" "}
                  <span className="text-[#8C1839]">
                    ★
                  </span>
                </p>
                <p className="mt-1 text-[9px] text-[#211A18]/40">
                  {ratingCount} review
                  {ratingCount ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <p className="mt-3 text-[8px] text-[#211A18]/35">
                Rating read-only hai.
                Review service update karegi.
              </p>
            </Card>
          )}

          <Card title="Tags">
            <textarea
              value={
                tags
              }
              onChange={(
                event
              ) =>
                setTags(
                  event.target.value
                )
              }
              rows={4}
              className={`${inputClass} h-auto py-3`}
              placeholder="sports bra, padded, seamless"
            />
          </Card>

          <Card title="Summary">
            <div className="space-y-2">
              <SummaryRow
                label="Images"
                value={`${mainImages.filter(
                  (
                    image
                  ) =>
                    image.url
                ).length}`}
              />

              <SummaryRow
                label="Colors"
                value={String(
                  isColor
                    ? colors.filter(
                    (
                      color
                    ) =>
                      color.name.trim()
                  ).length
                    : 0
                )}
              />

              <SummaryRow
                label="Categories"
                value={String(
                  selectedCategories.length
                )}
              />

              <SummaryRow
                label="Total Stock"
                value={String(
                  isColor
                    ? calculateTotalStock(
                        colors
                      )
                    : Math.max(
                        0,
                        Number(stock) || 0
                      )
                )}
              />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

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
  const id =
    getCategoryId(
      category
    );

  if (!id) {
    return null;
  }

  return (
    <>
      <label
        style={{
          paddingLeft:
            8 +
            Number(
              category.level ||
                0
            ) *
              14,
        }}
        className="mb-1 flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-2 text-[10px] hover:bg-[#FAF8F6]"
      >
        <input
          type="checkbox"
          checked={
            selected.includes(
              id
            )
          }
          onChange={() =>
            toggle(id)
          }
          className="h-4 w-4 accent-[#8C1839]"
        />
        {category.name}
      </label>

      {(category.children ||
        []).map(
        (
          child
        ) => (
          <CategoryOption
            key={
              getCategoryId(
                child
              )
            }
            category={
              child
            }
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
    <section className="overflow-hidden rounded-[22px] border border-[#211A18]/10 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#211A18]/10 px-5 py-4">
        <h2 className="text-[14px] font-semibold">
          {title}
        </h2>
        {action}
      </div>

      <div className="p-5">
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
      <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#211A18]/50">
        {label}
        {required && (
          <span className="ml-1 text-[#8C1839]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function MoneyInput({
  value,
  setValue,
}: {
  value: string;
  setValue: (
    value: string
  ) => void;
}) {
  return (
    <div className="flex h-12 overflow-hidden rounded-xl border border-[#211A18]/10 bg-[#FAF8F6]">
      <span className="flex items-center border-r border-[#211A18]/10 px-3">
        ₹
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={
          value
        }
        onChange={(
          event
        ) =>
          setValue(
            event.target.value
          )
        }
        className="min-w-0 flex-1 bg-transparent px-3 text-[11px] outline-none"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#FAF8F6] p-3">
      <span className="text-[10px] font-semibold">
        {label}
      </span>

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
      className={`relative h-7 w-12 rounded-full ${
        checked
          ? "bg-[#8C1839]"
          : "bg-[#211A18]/15"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked
            ? "left-6"
            : "left-1"
        }`}
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
    <div className="flex items-center justify-between rounded-lg bg-[#FAF8F6] px-3 py-3">
      <span className="text-[9px] text-[#211A18]/50">
        {label}
      </span>
      <span className="text-[9px] font-semibold">
        {value}
      </span>
    </div>
  );
}

function Message({
  tone,
  children,
}: {
  tone:
    | "error"
    | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={`mt-5 rounded-xl border px-4 py-3 text-[11px] ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {children}
    </div>
  );
}

function normalizeMainImages(
  images: ImageValue[]
): ImageValue[] {
  return (images || [])
    .filter(image =>
      Boolean(
        image?.url &&
        image?.publicId
      )
    )
    .map((image, index) => ({
      url: image.url,
      publicId: image.publicId,
      name:
        image.name ||
        image.alt ||
        `product-image-${index + 1}`,
      alt:
        image.alt ||
        image.name ||
        `Product image ${index + 1}`,
      isDefault:
        image.isDefault ??
        index === 0,
    }));
}

function normalizeColors(
  apiColors:
    ProductApiData["colors"]
): ColorInput[] {
  if (
    !apiColors ||
    apiColors.length === 0
  ) {
    return [
      {
        ...emptyColor(),
        isDefault: true,
      },
    ];
  }

  return apiColors.map(
    (color, colorIndex) => ({
      name:
        color.nameColor ||
        color.name ||
        "",

      hex:
        color.hex ||
        "#000000",

      isDefault:
        color.isDefault ??
        colorIndex === 0,

      nameProduct:
        color.nameProduct ||
        "",

      slugProduct:
        color.slugProduct ||
        "",

      shortDescription:
        color.shortDescription ||
        "",

      description:
        color.description ||
        "",

      tags:
        Array.isArray(color.tags)
          ? color.tags.join(", ")
          : "",

      seoTitle:
        color.seoTitle ||
        "",

      seoDescription:
        color.seoDescription ||
        "",

      images:
        normalizeMainImages(
          color.images || []
        ),

      sizes:
        color.sizes &&
        color.sizes.length > 0
          ? color.sizes.map(
              size => ({
                size:
                  size.size ||
                  "",
                sku:
                  size.sku ||
                  "",
                stock:
                  String(
                    size.stock ??
                    0
                  ),
                isActive:
                  size.isActive !==
                  false,
              })
            )
          : [
              emptySize(),
            ],

      isActive:
        color.isActive !==
        false,
    })
  );
}

function getCategoryId(
  category: CategoryNode
) {
  return String(
    category.id ||
      category._id ||
      ""
  );
}

function slugifyProductSlug(
  value: string
) {
  return value
    .normalize(
      "NFKC"
    )
    .toLowerCase()
    .trim()
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^\p{L}\p{N}]+/gu,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function slugifyFolder(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .normalize(
      "NFKD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function calculateTotalStock(
  colors: ColorInput[]
) {
  return colors.reduce(
    (
      productTotal,
      color
    ) =>
      productTotal +
      color.sizes.reduce(
        (
          colorTotal,
          size
        ) =>
          colorTotal +
          Math.max(
            0,
            Number(
              size.stock
            ) ||
              0
          ),
        0
      ),
    0
  );
}

function LoadingSpinner() {
  return (
    <span className="block h-7 w-7 animate-spin rounded-full border-2 border-[#211A18]/10 border-t-[#8C1839]" />
  );
}

const inputClass = `
  h-12
  w-full
  rounded-xl
  border
  border-[#211A18]/10
  bg-[#FAF8F6]
  px-4
  text-[11px]
  text-[#211A18]
  outline-none
  focus:border-[#8C1839]
`;

const smallInputClass = `
  h-10
  w-full
  rounded-lg
  border
  border-[#211A18]/10
  bg-[#FAF8F6]
  px-3
  text-[10px]
  outline-none
  focus:border-[#8C1839]
`;
