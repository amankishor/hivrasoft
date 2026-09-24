import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import ProductDetails, {
  type ProductDetailsData,
} from "@/src/components/Product/ProductDetails/ProductDetails";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const dynamic =
  "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProduct(
  slug: string
): Promise<ProductDetailsData | null> {
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

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    const product =
      data.product ??
      data.data ??
      data;

    if (
      !product ||
      typeof product !==
        "object" ||
      !product.slug
    ) {
      return null;
    }

    return product as ProductDetailsData;
  } catch (error) {
    console.error(
      "Product API error:",
      error
    );

    return null;
  }
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const {
    slug,
  } = await params;

  const product =
    await getProduct(
      slug
    );

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />

      <ProductDetails
        product={
          product
        }
      />
    </>
  );
}