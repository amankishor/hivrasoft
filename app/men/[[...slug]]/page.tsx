import Header from "@/components/Header/Header";
import MenCatalog from "@/components/Men/MenCatalog";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type MediaImage = {
  url?: string;
  secure_url?: string;
  src?: string;
  imageUrl?: string;

  publicId?: string;
  public_id?: string;

  alt?: string;
  name?: string;
};

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

type ApiCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  description?: string;

  images?: Array<
    string | MediaImage
  >;

  categoryImages?: Array<
    string | MediaImage
  >;

  image?:
    | string
    | MediaImage;

  bannerImage?:
    | string
    | MediaImage;

  desktopImage?:
    | string
    | MediaImage;

  thumbnail?:
    | string
    | MediaImage;

  isActive?: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

function normalize(
  value?: string
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function getImageUrl(
  image?:
    | string
    | MediaImage
    | null
) {
  if (!image) {
    return "";
  }

  if (
    typeof image === "string"
  ) {
    return image;
  }

  return (
    image.url ||
    image.secure_url ||
    image.imageUrl ||
    image.src ||
    ""
  );
}

/* =========================================================
   CATEGORY BANNER
========================================================= */

function getCategoryBannerUrl(
  category: ApiCategory | null
) {
  if (!category) {
    return "";
  }

  if (
    Array.isArray(
      category.images
    ) &&
    category.images.length > 0
  ) {
    const url =
      getImageUrl(
        category.images[0]
      );

    if (url) {
      return url;
    }
  }

  if (
    Array.isArray(
      category.categoryImages
    ) &&
    category.categoryImages.length > 0
  ) {
    const url =
      getImageUrl(
        category.categoryImages[0]
      );

    if (url) {
      return url;
    }
  }

  return (
    getImageUrl(
      category.bannerImage
    ) ||
    getImageUrl(
      category.desktopImage
    ) ||
    getImageUrl(
      category.image
    ) ||
    getImageUrl(
      category.thumbnail
    ) ||
    ""
  );
}

/* =========================================================
   EXTRACT CATEGORY
========================================================= */

function extractCategory(
  result: unknown
): ApiCategory | null {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return null;
  }

  const object =
    result as Record<
      string,
      unknown
    >;

  if (
    object.category &&
    typeof object.category ===
      "object" &&
    !Array.isArray(
      object.category
    )
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
    const data =
      object.data as Record<
        string,
        unknown
      >;

    if (
      data.category &&
      typeof data.category ===
        "object" &&
      !Array.isArray(
        data.category
      )
    ) {
      return data.category as ApiCategory;
    }

    return object.data as ApiCategory;
  }

  return result as ApiCategory;
}

/* =========================================================
   FETCH MEN CATEGORY
========================================================= */

async function getMenCategory(): Promise<
  ApiCategory | null
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/categories/slug/men`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return null;
    }

    const result: unknown =
      await response.json();

    return extractCategory(
      result
    );
  } catch (error) {
    console.error(
      "Men category fetch error:",
      error
    );

    return null;
  }
}

/* =========================================================
   CHECK MEN PRODUCT
========================================================= */

function isMenProduct(
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
        slug === "men" ||
        name === "men"
      );
    }
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
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return [];
    }

    const result: unknown =
      await response.json();

    if (
      Array.isArray(result)
    ) {
      return result as ApiProduct[];
    }

    if (
      result &&
      typeof result === "object"
    ) {
      const object =
        result as Record<
          string,
          unknown
        >;

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

      if (
        object.data &&
        typeof object.data ===
          "object"
      ) {
        const nested =
          object.data as Record<
            string,
            unknown
          >;

        if (
          Array.isArray(
            nested.products
          )
        ) {
          return nested.products as ApiProduct[];
        }
      }
    }

    return [];
  } catch (error) {
    console.error(
      "Men products fetch error:",
      error
    );

    return [];
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function MenPage() {
  const [
    products,
    category,
  ] =
    await Promise.all([
      getProducts(),
      getMenCategory(),
    ]);

  const menProducts =
    products.filter(
      isMenProduct
    );

  const bannerUrl =
    getCategoryBannerUrl(
      category
    );

  const mappedProducts =
    menProducts.map(
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

        const colorImages =
          Array.isArray(
            activeColors[0]
              ?.images
          )
            ? activeColors[0]
                .images!
            : [];

        /*
          IMPORTANT:
          Color product image ko priority
          di hai so size-chart first image
          hone ka issue kam hoga.
        */

        return {
          id:
            product._id ||
            product.id ||
            String(index),

          name:
            product.name ||
            "Men Product",

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
            colorImages[0]
              ?.url ||
            mainImages[0]
              ?.url ||
            "",

          hoverImage:
            colorImages[1]
              ?.url ||
            mainImages[1]
              ?.url ||
            colorImages[0]
              ?.url ||
            mainImages[0]
              ?.url ||
            "",

          colorCount:
            activeColors.length,
        };
      }
    );

  return (
    <>
      <Header />

      <MenCatalog
        products={
          mappedProducts
        }
        bannerUrl={
          bannerUrl
        }
        categoryName={
          category?.name ||
          "Men"
        }
      />
    </>
  );
}