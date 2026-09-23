"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct } from "@/lib/product-catalog";

export type ProductDetailsData = CatalogProduct;

function cleanDescriptionHtml(html?: string) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export default function ProductDetails({ product }: { product: ProductDetailsData }) {
  const activeColors = useMemo(
    () => (Array.isArray(product.colors) ? product.colors : []),
    [product.colors]
  );

  const defaultColorIndex = Math.max(
    0,
    activeColors.findIndex((color) => color.isDefault)
  );

  const [selectedColorIndex, setSelectedColorIndex] = useState(
    defaultColorIndex >= 0 ? defaultColorIndex : 0
  );
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const selectedColor = activeColors[selectedColorIndex] || activeColors[0];
  const images = (selectedColor?.images || []).filter((image) => Boolean(image?.url));
  const sizes = (selectedColor?.sizes || []).filter((size) => size?.isActive !== false);
  const selectedSize = selectedSizeIndex !== null ? sizes[selectedSizeIndex] : undefined;

  const totalStock = activeColors.reduce(
    (total, color) =>
      total +
      (color.sizes || []).reduce(
        (sum, size) => sum + (size.isActive === false ? 0 : Math.max(0, Number(size.stock || 0))),
        0
      ),
    0
  );

  const currentStock = selectedSize ? Math.max(0, Number(selectedSize.stock || 0)) : totalStock;
  const name = selectedColor?.nameProduct || "Product";
  const shortDescription = selectedColor?.shortDescription || "";
  const descriptionHtml = cleanDescriptionHtml(selectedColor?.description);

  const selectColor = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedSizeIndex(null);
    setActiveImageIndex(0);
    setQuantity(1);
  };

  const selectSize = (index: number) => {
    const size = sizes[index];
    if (!size || size.isActive === false || Number(size.stock || 0) <= 0) return;
    setSelectedSizeIndex(index);
    setQuantity(1);
  };

  return (
    <main className="min-h-screen bg-white text-[#292526]">
      <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-8 px-4 pb-12 pt-8 md:px-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-12">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f3f3f3]">
            {images.length ? (
              <img
                src={images[Math.min(activeImageIndex, images.length - 1)]?.url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-black/35">No Product Image</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={`${image.publicId}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    activeImageIndex === index ? "border-[#8C1839]" : "border-transparent"
                  }`}
                >
                  <img src={image.url} alt={`${name} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <div className="flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8C1839]">
            {product.isNewLaunch && <span>New Launch</span>}
            {product.isFeatured && <span>Featured</span>}
          </div>

          <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#211A18] md:text-3xl">{name}</h1>
          {shortDescription && <p className="mt-4 max-w-xl text-sm leading-6 text-[#211A18]/60">{shortDescription}</p>}

          {activeColors.length > 0 && (
            <div className="mt-8">
              <div className="text-sm font-semibold">Color: <span className="font-normal text-black/55">{selectedColor?.nameColor}</span></div>
              <div className="mt-4 flex flex-wrap gap-3">
                {activeColors.map((color, index) => {
                  const image = color.images?.find((item) => item.isDefault)?.url || color.images?.[0]?.url;
                  return (
                    <button key={`${color.slugColor}-${index}`} type="button" onClick={() => selectColor(index)} className="w-[76px] text-center">
                      <div className={`aspect-[4/5] overflow-hidden rounded-lg border-2 ${selectedColorIndex === index ? "border-[#211A18]" : "border-transparent"}`}>
                        {image ? (
                          <img src={image} alt={color.nameColor} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center bg-[#f5f2ef]"><span className="h-8 w-8 rounded-full border" style={{ backgroundColor: color.hex || "#ddd" }} /></div>
                        )}
                      </div>
                      <span className="mt-1 block truncate text-[10px]">{color.nameColor}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-8">
              <div className="text-sm font-semibold">Select Size</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {sizes.map((size, index) => {
                  const disabled = Number(size.stock || 0) <= 0;
                  return (
                    <button
                      key={size._id || `${size.size}-${index}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectSize(index)}
                      className={`min-w-12 rounded-lg border px-4 py-3 text-xs font-semibold ${
                        selectedSizeIndex === index ? "border-[#211A18] bg-[#211A18] text-white" : "border-black/20"
                      } ${disabled ? "cursor-not-allowed opacity-30 line-through" : ""}`}
                    >
                      {size.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 text-sm">
            {totalStock > 0 ? <span className="text-green-700">In Stock ({currentStock})</span> : <span className="text-red-600">Out of Stock</span>}
          </div>

          <div className="mt-6 grid grid-cols-[130px_1fr] gap-3">
            <div className="flex h-12 items-center justify-between rounded-lg border border-black/40 px-4">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <strong>{quantity}</strong>
              <button type="button" disabled={quantity >= currentStock} onClick={() => setQuantity((value) => Math.min(Math.max(1, currentStock), value + 1))}>+</button>
            </div>
            <button
              type="button"
              disabled={totalStock <= 0 || (sizes.length > 0 && !selectedSize)}
              className="h-12 rounded-lg bg-[#2F2D2D] px-5 text-xs font-semibold uppercase text-white hover:bg-[#9D173E] disabled:cursor-not-allowed disabled:bg-[#aaa]"
            >
              {totalStock <= 0 ? "Out Of Stock" : sizes.length > 0 && !selectedSize ? "Select Size" : "Add To Bag"}
            </button>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 px-4 py-12 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9D173E]">Product Information</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#211A18]">Product Description</h2>
          {descriptionHtml ? (
            <div className="prose mt-6 max-w-4xl text-sm leading-7 text-[#554A45]" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          ) : (
            <p className="mt-5 text-sm text-black/45">No description available.</p>
          )}
        </div>
      </section>
    </main>
  );
}
