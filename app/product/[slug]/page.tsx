import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import ProductDetails from "@/src/components/Product/ProductDetails/ProductDetails";

import {
  type ApiProduct,
} from "@/src/Services/products";

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/+$/,
    ""
  ) ||
  "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

export const dynamic =
  "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function readJson(
  response: Response
): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function extractProduct(
  data: any
): ApiProduct | null {
  return (
    data?.product ||
    data?.data?.product ||
    (
      data?.data &&
      !Array.isArray(
        data.data
      )
        ? data.data
        : null
    )
  );
}

function extractProducts(
  data: any
): ApiProduct[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }

  if (
    Array.isArray(
      data?.products
    )
  ) {
    return data.products;
  }

  if (
    Array.isArray(
      data?.data
    )
  ) {
    return data.data;
  }

  if (
    Array.isArray(
      data?.data?.products
    )
  ) {
    return data.data.products;
  }

  return [];
}

async function loadProduct(
  slug: string
): Promise<ApiProduct | null> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/slug/${encodeURIComponent(
          slug
        )}`,
        {
          cache:
            "no-store",
        }
      );

    if (
      response.ok
    ) {
      const product =
        extractProduct(
          await readJson(
            response
          )
        );

      if (
        product
      ) {
        return product;
      }
    }
  } catch {
    // fallback
  }

  const response =
    await fetch(
      `${API_URL}/api/products/active`,
      {
        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    return null;
  }

  const products =
    extractProducts(
      await readJson(
        response
      )
    );

  const target =
    slug
      .trim()
      .toLowerCase();

  return (
    products.find(
      (
        product
      ) =>
        String(
          product.slug ||
            ""
        ).toLowerCase() ===
        target
    ) ||
    products.find(
      (
        product
      ) =>
        product.colors?.some(
          (
            color
          ) =>
            String(
              color.slugProduct ||
                ""
            ).toLowerCase() ===
            target
        )
    ) ||
    null
  );
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const {
    slug,
  } =
    await params;

  const product =
    await loadProduct(
      slug
    );

  if (
    !product
  ) {
    notFound();
  }

  return (
    <>
      <Header />

      <ProductDetails
        product={
          product
        }
        currentSlug={
          slug
        }
      />
    </>
  );
}