import BundlePricingCatalog from "@/components/BundlePricing/BundlePricingCatalog";

/* =========================================================
   TYPES
========================================================= */

type ProductImage = {
  url: string;
  publicId?: string;
};

type ProductCategory = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

type ProductColor = {
  name?: string;
  hex?: string;
  images?: ProductImage[];
  isActive?: boolean;
};

type ApiProduct = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  shortDescription?: string;

  price?: number;
  compareAtPrice?: number;

  mainImages?: ProductImage[];
  colors?: ProductColor[];

  categories?: ProductCategory[];

  status?: string;
};

type CategoryImageObject = {
  url?: string;
  secure_url?: string;
  publicId?: string;
  public_id?: string;
};

type ApiCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  description?: string;

  bannerImage?:
    | string
    | CategoryImageObject;

  banner?:
    | string
    | CategoryImageObject;

  image?:
    | string
    | CategoryImageObject;

  desktopBanner?:
    | string
    | CategoryImageObject;

  isActive?: boolean;
};

type BundleProduct = {
  id: string;

  name: string;
  slug: string;

  shortDescription: string;

  price: number;
  compareAtPrice: number;

  image: string;
  hoverImage: string;

  colorCount: number;
};

/* =========================================================
   DYNAMIC
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   NORMALIZE
========================================================= */

function normalize(
  value?: string
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[_\s]+/g,
      "-"
    );
}

/* =========================================================
   BUNDLE PRODUCT CHECK
========================================================= */

function isBundlePricingProduct(
  product: ApiProduct
) {
  if (
    !Array.isArray(
      product.categories
    )
  ) {
    return false;
  }

  return product.categories.some(
    (category) => {
      const slug =
        normalize(
          category.slug
        );

      const name =
        normalize(
          category.name
        );

      return (
        slug ===
          "bundle-pricing" ||
        name ===
          "bundle-pricing"
      );
    }
  );
}

/* =========================================================
   IMAGE URL HELPER

   Supports:
   bannerImage.url
   banner.url
   image.url
   desktopBanner.url

   or direct string URL
========================================================= */

function getImageUrl(
  value:
    | string
    | CategoryImageObject
    | undefined
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return (
    value.url ||
    value.secure_url ||
    ""
  );
}

/* =========================================================
   FETCH PRODUCTS
========================================================= */

async function getProducts(): Promise<
  ApiProduct[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/active`,
        {
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Bundle products fetch failed:",
        response.status
      );

      return [];
    }

    const result:
      unknown =
      await response.json();

    if (
      Array.isArray(result)
    ) {
      return result as ApiProduct[];
    }

    if (
      result &&
      typeof result ===
        "object"
    ) {
      const object =
        result as {
          products?: unknown;
          data?: unknown;
        };

      if (
        Array.isArray(
          object.products
        )
      ) {
        return object.products as ApiProduct[];
      }

      if (
        Array.isArray(
          object.data
        )
      ) {
        return object.data as ApiProduct[];
      }
    }

    return [];
  } catch (error) {
    console.error(
      "Bundle products fetch error:",
      error
    );

    return [];
  }
}

/* =========================================================
   FETCH BUNDLE CATEGORY
========================================================= */

async function getBundleCategory(): Promise<
  ApiCategory | null
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/categories/slug/bundle-pricing`,
        {
          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Bundle category fetch failed:",
        response.status
      );

      return null;
    }

    const result:
      unknown =
      await response.json();

    if (
      !result ||
      typeof result !==
        "object"
    ) {
      return null;
    }

    const object =
      result as {
        category?: unknown;
        data?: unknown;
      };

    if (
      object.category &&
      typeof object.category ===
        "object"
    ) {
      return object.category as ApiCategory;
    }

    if (
      object.data &&
      typeof object.data ===
        "object" &&
      !Array.isArray(
        object.data
      )
    ) {
      return object.data as ApiCategory;
    }

    return result as ApiCategory;
  } catch (error) {
    console.error(
      "Bundle category fetch error:",
      error
    );

    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function BundlePricingPage() {
  const [
    products,
    category,
  ] = await Promise.all([
    getProducts(),
    getBundleCategory(),
  ]);

  const bundleProducts =
    products.filter(
      isBundlePricingProduct
    );

  const mappedProducts: BundleProduct[] =
    bundleProducts.map(
      (
        product,
        index
      ) => {
        const mainImages =
          Array.isArray(
            product.mainImages
          )
            ? product.mainImages.filter(
                (image) =>
                  Boolean(
                    image?.url
                  )
              )
            : [];

        const activeColors =
          Array.isArray(
            product.colors
          )
            ? product.colors.filter(
                (color) =>
                  color.isActive !==
                  false
              )
            : [];

        const firstColorImages =
          Array.isArray(
            activeColors[0]
              ?.images
          )
            ? activeColors[0]
                .images
            : [];

        return {
          id:
            product._id ||
            product.id ||
            String(index),

          name:
            product.name ||
            "Product",

          slug:
            product.slug ||
            "",

          shortDescription:
            product.shortDescription ||
            "",

          price:
            Number(
              product.price
            ) || 0,

          compareAtPrice:
            Number(
              product.compareAtPrice ||
                0
            ),

          image:
            mainImages[0]
              ?.url ||
            firstColorImages[0]
              ?.url ||
            "",

          hoverImage:
            mainImages[1]
              ?.url ||
            firstColorImages[1]
              ?.url ||
            mainImages[0]
              ?.url ||
            "",

          colorCount:
            activeColors.length,
        };
      }
    );

  /* =======================================================
     CATEGORY BANNER

     Multiple field names supported.
  ======================================================= */

  const bannerUrl =
    getImageUrl(
      category?.bannerImage
    ) ||
    getImageUrl(
      category?.banner
    ) ||
    getImageUrl(
      category?.desktopBanner
    ) ||
    getImageUrl(
      category?.image
    );

  return (
    <BundlePricingCatalog
      products={
        mappedProducts
      }
      bannerUrl={
        bannerUrl
      }
      categoryName={
        category?.name ||
        "Bundle Pricing"
      }
    />
  );
}