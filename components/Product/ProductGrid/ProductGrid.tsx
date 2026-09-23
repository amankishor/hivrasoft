"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { catalogProductsFromResponse, type DisplayProduct } from "@/lib/product-catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProductGrid() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/api/products/catalog`, { method: "GET", cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Unable to load products.");
        setProducts(catalogProductsFromResponse(data));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load products.");
      } finally {
        setLoading(false);
      }
    };
    void loadProducts();
  }, []);

  if (loading) {
    return <section className="min-h-[500px] bg-[#F8F5F2] px-5 py-16"><div className="mx-auto flex max-w-[1500px] justify-center py-24 text-xs text-[#211A18]/50">Loading products...</div></section>;
  }

  if (error) {
    return <section className="min-h-[500px] bg-[#F8F5F2] px-5 py-16"><div className="mx-auto max-w-[1500px] rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs text-red-600">{error}</div></section>;
  }

  return (
    <section className="min-h-screen bg-[#F8F5F2] px-4 pb-20 pt-12 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#8C1839]">Shop Collection</p>
            <h1 className="mt-2 text-[28px] font-semibold text-[#211A18] md:text-[36px]">All Products</h1>
            <p className="mt-2 text-[11px] text-[#211A18]/50">Explore our complete collection.</p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#211A18]/40">{products.length} {products.length === 1 ? "Product" : "Products"}</p>
        </div>

        {products.length === 0 ? (
          <div className="grid min-h-[400px] place-items-center rounded-2xl border border-[#211A18]/10 bg-white text-sm text-[#211A18]/50">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {products.map((product) => <ProductItem key={product._id} product={product} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductItem({ product }: { product: DisplayProduct }) {
  const firstImage = product.mainImages?.[0]?.url || "";
  const hoverImage = product.mainImages?.[1]?.url || "";
  const defaultColor = product.colors?.find((color) => color.isDefault) || product.colors?.[0];

  return (
    <article className="group min-w-0">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#EEE9E4] md:rounded-[18px]">
          {firstImage ? (
            <>
              <img src={firstImage} alt={product.name} className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${hoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.02]"}`} />
              {hoverImage && <img src={hoverImage} alt={`${product.name} alternate`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
            </>
          ) : <div className="grid h-full place-items-center text-xs text-[#211A18]/25">No image</div>}

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNewLaunch && <span className="rounded-full bg-white px-2.5 py-1 text-[7px] font-semibold uppercase text-[#8C1839]">New</span>}
            {product.isFeatured && <span className="rounded-full bg-[#211A18] px-2.5 py-1 text-[7px] font-semibold uppercase text-white">Featured</span>}
          </div>
        </div>

        <div className="pt-3">
          <h2 className="line-clamp-2 text-[13px] font-semibold text-[#211A18] md:text-[14px]">{product.name}</h2>
          {product.shortDescription && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#211A18]/45">{product.shortDescription}</p>}
          <div className="mt-2 flex items-center justify-between gap-3 text-[9px]">
            <span className={product.stock > 0 ? "text-green-700" : "text-red-600"}>{product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}</span>
            {defaultColor?.nameColor && <span className="text-[#211A18]/45">{defaultColor.nameColor}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
