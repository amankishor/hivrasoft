import {
  notFound,
} from "next/navigation";

import Header from "@/components/Header/Header";

import WomenCatalog from "@/components/Women/WomenCatalog";

import {
  filterWomenProducts,
  getWomenBanners,
  getWomenPageDescription,
  getWomenPageTitle,
  isValidWomenPath,
} from "@/data/women";


type WomenPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};


/* =========================================================
   WOMEN PAGE
========================================================= */

export default async function WomenPage({
  params,
}: WomenPageProps) {
  const resolvedParams =
    await params;


  const slugParts =
    resolvedParams.slug ?? [];


  /*
   * Supported:
   *
   * /women/
   *
   * /women/bra/
   *
   * /women/bra/sports-bra/
   */

  if (
    slugParts.length > 2
  ) {
    notFound();
  }


  const category =
    slugParts[0];

  const subcategory =
    slugParts[1];


  /* =======================================================
     VALIDATE URL
  ======================================================= */

  if (
    !isValidWomenPath(
      category,
      subcategory
    )
  ) {
    notFound();
  }


  /* =======================================================
     PRODUCTS
  ======================================================= */

  const products =
    filterWomenProducts(
      category,
      subcategory
    );


  /* =======================================================
     BANNERS
  ======================================================= */

  const banners =
    getWomenBanners(
      category,
      subcategory
    );


  /* =======================================================
     PAGE CONTENT
  ======================================================= */

  const title =
    getWomenPageTitle(
      category,
      subcategory
    );


  const description =
    getWomenPageDescription(
      category,
      subcategory
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <WomenCatalog
        products={products}
        banners={banners}
        title={title}
        description={
          description
        }
        category={category}
        subcategory={
          subcategory
        }
      />
    </>
  );
}