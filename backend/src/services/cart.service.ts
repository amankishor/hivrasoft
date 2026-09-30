import mongoose, {
  Types,
} from "mongoose";

import Cart, {
  ICart,
} from "../models/Cart.model";

import Product from "../models/Product.model";

import DiscountCode from "../models/DiscountCode.model";

import {
  calculateDiscounts,
} from "./discount.service";

import {
  trackUserActivity,
} from "./activity.service";

/* =========================================================
   TYPES
========================================================= */

export interface AddCartItemData {
  productId: string;

  colorId: string;

  sizeId: string;

  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

/* =========================================================
   VALIDATE OBJECT ID
========================================================= */

const validateObjectId = (
  value: string,
  fieldName: string
) => {
  if (
    !value ||
    !mongoose.Types.ObjectId.isValid(
      value
    )
  ) {
    throw new Error(
      `Invalid ${fieldName}.`
    );
  }
};

/* =========================================================
   QUANTITY
========================================================= */

const normalizeQuantity = (
  value: unknown,
  defaultValue = 1
): number => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  const quantity =
    Number(value);

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1 ||
    quantity > 99
  ) {
    throw new Error(
      "Quantity must be a whole number between 1 and 99."
    );
  }

  return quantity;
};

/* =========================================================
   POSITIVE NUMBER
========================================================= */

const positiveNumber = (
  ...values: unknown[]
): number | undefined => {
  for (
    const value of values
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(
        number
      ) &&
      number > 0
    ) {
      return number;
    }
  }

  return undefined;
};

/* =========================================================
   PRODUCT ACTIVE

   Main current field:
   product.isActive

   Legacy status fallback bhi rakha hai.
========================================================= */

const isProductActive = (
  product: any
): boolean => {
  if (
    product?.isActive ===
    true
  ) {
    return true;
  }

  if (
    product?.status ===
    "active"
  ) {
    return true;
  }

  return false;
};

/* =========================================================
   COLOR ACTIVE

   Current Product Color schema me isActive
   zaroori nahi hai.

   Undefined => active
   false     => inactive
========================================================= */

const isColorActive = (
  color: any
): boolean => {
  return (
    color?.isActive !==
    false
  );
};

/* =========================================================
   SIZE ACTIVE
========================================================= */

const isSizeActive = (
  size: any
): boolean => {
  return (
    size?.isActive !==
    false
  );
};

/* =========================================================
   FIND VARIANT
========================================================= */

const getVariant = (
  product: any,
  colorId: string,
  sizeId: string
) => {
  const color =
    product.colors?.find(
      (
        item: any
      ) =>
        String(
          item?._id
        ) ===
        String(
          colorId
        )
    );

  if (!color) {
    throw new Error(
      "Selected product color was not found."
    );
  }

  if (
    !isColorActive(
      color
    )
  ) {
    throw new Error(
      "Selected product color is inactive."
    );
  }

  const size =
    color.sizes?.find(
      (
        item: any
      ) =>
        String(
          item?._id
        ) ===
        String(
          sizeId
        )
    );

  if (!size) {
    throw new Error(
      "Selected product size was not found."
    );
  }

  if (
    !isSizeActive(
      size
    )
  ) {
    throw new Error(
      "Selected product size is inactive."
    );
  }

  return {
    color,

    size,
  };
};

/* =========================================================
   AVAILABLE STOCK

   IMPORTANT:

   Tumhare current Product structure me stock
   size ke andar hai.

   product.stock absent ho sakta hai.

   Isliye primary stock = size.stock
========================================================= */

const getAvailableStock = (
  product: any,
  size: any
): number => {
  const sizeStock =
    Math.max(
      0,
      Number(
        size?.stock ??
          0
      ) || 0
    );

  /*
   * Agar legacy product.stock exist karta hai,
   * tab dono ka minimum lenge.
   */

  if (
    product?.stock !==
      undefined &&
    product?.stock !==
      null &&
    product?.stock !==
      ""
  ) {
    const productStock =
      Number(
        product.stock
      );

    if (
      Number.isFinite(
        productStock
      )
    ) {
      return Math.max(
        0,
        Math.min(
          productStock,
          sizeStock
        )
      );
    }
  }

  return sizeStock;
};

/* =========================================================
   UNIT PRICE

   Priority:
   1. Size showPrice
   2. Color showPrice
   3. Legacy selling/price
   4. Original price

   discountPrice is NOT selling price.
========================================================= */

const getUnitPrice = (
  product: any,
  color: any,
  size: any
): number => {
  return (
    positiveNumber(
      size?.showPrice,

      color?.showPrice,

      product?.showPrice,

      size?.sellingPrice,

      color?.sellingPrice,

      product?.sellingPrice,

      size?.salePrice,

      color?.salePrice,

      product?.salePrice,

      size?.price,

      color?.price,

      product?.price,

      size?.originalPrice,

      color?.originalPrice,

      product?.originalPrice
    ) ?? 0
  );
};

/* =========================================================
   ORIGINAL PRICE
========================================================= */

const getOriginalPrice = (
  product: any,
  color: any,
  size: any,
  unitPrice: number
): number => {
  const value =
    positiveNumber(
      size?.originalPrice,

      color?.originalPrice,

      product?.originalPrice,

      size?.mrp,

      color?.mrp,

      product?.mrp,

      size?.compareAtPrice,

      color?.compareAtPrice,

      product?.compareAtPrice
    ) ??
    unitPrice;

  return value >
    unitPrice
    ? value
    : unitPrice;
};

/* =========================================================
   PRODUCT NAME
========================================================= */

const getProductName = (
  product: any,
  color: any
): string => {
  return String(
    color?.nameProduct ||
      product?.name ||
      "Product"
  );
};

/* =========================================================
   PRODUCT SLUG
========================================================= */

const getProductSlug = (
  product: any,
  color: any
): string => {
  return String(
    color?.slugProduct ||
      product?.slug ||
      ""
  );
};

/* =========================================================
   PRODUCT IMAGE
========================================================= */

const getProductImages = (
  product: any,
  color: any
) => {
  if (
    Array.isArray(
      color?.images
    ) &&
    color.images.length >
      0
  ) {
    return color.images;
  }

  if (
    Array.isArray(
      product?.mainImages
    )
  ) {
    return product.mainImages;
  }

  if (
    Array.isArray(
      product?.images
    )
  ) {
    return product.images;
  }

  return [];
};

/* =========================================================
   GET OR CREATE CART
========================================================= */

const getOrCreateCart =
  async (
    userId: string
  ): Promise<ICart> => {
    let cart =
      await Cart.findOne({
        user:
          userId,
      });

    if (!cart) {
      cart =
        await Cart.create({
          user:
            new Types.ObjectId(
              userId
            ),

          items: [],
        });
    }

    return cart;
  };

/* =========================================================
   BUILD CART RESPONSE
========================================================= */

const buildCartResponse =
  async (
    cart: ICart
  ) => {
    const productIds =
      Array.from(
        new Set(
          cart.items.map(
            (
              item
            ) =>
              String(
                item.product
              )
          )
        )
      );

    const products =
      productIds.length >
      0
        ? await Product.find({
            _id: {
              $in:
                productIds,
            },
          }).lean()
        : [];

    const productMap =
      new Map(
        products.map(
          (
            product: any
          ) => [
            String(
              product._id
            ),

            product,
          ]
        )
      );

    let subtotal = 0;

    let totalItems = 0;

    const items =
      cart.items.map(
        (
          item
        ) => {
          const product =
            productMap.get(
              String(
                item.product
              )
            ) as any;

          const quantity =
            Number(
              item.quantity ||
                0
            );

          totalItems +=
            quantity;

          /* ===============================================
             PRODUCT MISSING
          =============================================== */

          if (!product) {
            return {
              _id:
                item._id,

              product:
                null,

              colorId:
                item.colorId,

              sizeId:
                item.sizeId,

              quantity,

              unitPrice:
                0,

              subtotal:
                0,

              availableStock:
                0,

              available:
                false,

              unavailableReason:
                "Product no longer exists.",

              addedAt:
                item.addedAt,
            };
          }

          /* ===============================================
             COLOR
          =============================================== */

          const color =
            product.colors?.find(
              (
                value: any
              ) =>
                String(
                  value?._id
                ) ===
                String(
                  item.colorId
                )
            );

          /* ===============================================
             SIZE
          =============================================== */

          const size =
            color?.sizes?.find(
              (
                value: any
              ) =>
                String(
                  value?._id
                ) ===
                String(
                  item.sizeId
                )
            );

          /* ===============================================
             STOCK
          =============================================== */

          const availableStock =
            color &&
            size
              ? getAvailableStock(
                  product,
                  size
                )
              : 0;

          /* ===============================================
             AVAILABILITY
          =============================================== */

          const available =
            isProductActive(
              product
            ) &&
            Boolean(
              color
            ) &&
            isColorActive(
              color
            ) &&
            Boolean(
              size
            ) &&
            isSizeActive(
              size
            ) &&
            availableStock >=
              quantity;

          /* ===============================================
             UNAVAILABLE REASON
          =============================================== */

          let unavailableReason =
            "";

          if (
            !isProductActive(
              product
            )
          ) {
            unavailableReason =
              "Product is inactive.";
          } else if (
            !color
          ) {
            unavailableReason =
              "Selected color is no longer available.";
          } else if (
            !isColorActive(
              color
            )
          ) {
            unavailableReason =
              "Selected color is inactive.";
          } else if (
            !size
          ) {
            unavailableReason =
              "Selected size is no longer available.";
          } else if (
            !isSizeActive(
              size
            )
          ) {
            unavailableReason =
              "Selected size is inactive.";
          } else if (
            availableStock <
            quantity
          ) {
            unavailableReason =
              `Only ${availableStock} item(s) are available in stock.`;
          }

          /* ===============================================
             PRICE
          =============================================== */

          const unitPrice =
            getUnitPrice(
              product,
              color,
              size
            );

          const originalPrice =
            getOriginalPrice(
              product,
              color,
              size,
              unitPrice
            );

          const itemSubtotal =
            unitPrice *
            quantity;

          if (available) {
            subtotal +=
              itemSubtotal;
          }

          /* ===============================================
             CART ITEM RESPONSE
          =============================================== */

          return {
            _id:
              item._id,

            product: {
              _id:
                product._id,

              name:
                getProductName(
                  product,
                  color
                ),

              slug:
                getProductSlug(
                  product,
                  color
                ),

              price:
                unitPrice,

              showPrice:
                unitPrice,

              originalPrice,

              compareAtPrice:
                originalPrice,

              stock:
                availableStock,

              mainImages:
                getProductImages(
                  product,
                  color
                ),

              isActive:
                isProductActive(
                  product
                ),

              status:
                isProductActive(
                  product
                )
                  ? "active"
                  : "inactive",
            },

            selectedColor:
              color
                ? {
                    _id:
                      color._id,

                    colorId:
                      String(
                        color._id
                      ),

                    name:
                      color.nameColor ||
                      color.name ||
                      "",

                    nameColor:
                      color.nameColor ||
                      color.name ||
                      "",

                    slug:
                      color.slugColor ||
                      color.slug ||
                      "",

                    slugColor:
                      color.slugColor ||
                      color.slug ||
                      "",

                    slugProduct:
                      color.slugProduct ||
                      "",

                    hex:
                      color.hex ||
                      "",

                    images:
                      color.images ||
                      [],

                    isActive:
                      isColorActive(
                        color
                      ),

                    originalPrice:
                      Number(
                        color.originalPrice ||
                          0
                      ),

                    showPrice:
                      Number(
                        color.showPrice ||
                          0
                      ),
                  }
                : null,

            selectedSize:
              size
                ? {
                    _id:
                      size._id,

                    sizeId:
                      String(
                        size._id
                      ),

                    size:
                      size.size,

                    sku:
                      size.sku,

                    stock:
                      Number(
                        size.stock ||
                          0
                      ),

                    isActive:
                      isSizeActive(
                        size
                      ),

                    originalPrice:
                      Number(
                        size.originalPrice ||
                          0
                      ),

                    showPrice:
                      Number(
                        size.showPrice ||
                          0
                      ),
                  }
                : null,

            colorId:
              item.colorId,

            sizeId:
              item.sizeId,

            quantity,

            unitPrice,

            originalPrice,

            subtotal:
              itemSubtotal,

            availableStock,

            available,

            unavailableReason:
              available
                ? ""
                : unavailableReason,

            addedAt:
              item.addedAt,
          };
        }
      );

    /* =====================================================
       DISCOUNTS
    ===================================================== */

    const discountResult =
      await calculateDiscounts(
        items
          .filter(
            (
              item: any
            ) =>
              item.available &&
              item.product?._id
          )
          .map(
            (
              item: any
            ) => ({
              productId:
                String(
                  item.product
                    ._id
                ),

              unitPrice:
                Number(
                  item.unitPrice ||
                    0
                ),

              quantity:
                Number(
                  item.quantity ||
                    0
                ),
            })
          ),

        cart.discountCode ||
          null
      );

    const discountByProduct =
      new Map(
        discountResult
          .itemDiscounts
          .map(
            (
              item
            ) => [
              item.productId,

              item,
            ]
          )
      );

    const discountedItems =
      items.map(
        (
          item: any
        ) => {
          if (
            !item.product?._id
          ) {
            return item;
          }

          const discount =
            discountByProduct.get(
              String(
                item.product
                  ._id
              )
            );

          return {
            ...item,

            discount:
              discount ||
              null,
          };
        }
      );

    const total =
      Math.max(
        0,
        subtotal -
          discountResult
            .totalDiscount
      );

    return {
      _id:
        cart._id,

      user:
        cart.user,

      items:
        discountedItems,

      totalItems,

      subtotal,

      automaticDiscount:
        discountResult
          .automaticDiscount,

      codeDiscount:
        discountResult
          .codeDiscount,

      discount:
        discountResult
          .totalDiscount,

      discountSummary: {
        automatic:
          discountResult
            .automatic,

        code:
          discountResult.code,
      },

      appliedDiscountCode:
        cart.discountCode ||
        "",

      total,

      createdAt:
        cart.createdAt,

      updatedAt:
        cart.updatedAt,
    };
  };

/* =========================================================
   ADD ITEM
========================================================= */

export const addItemToCart =
  async (
    userId: string,
    data: AddCartItemData
  ) => {
    /* =====================================================
       VALIDATE
    ===================================================== */

    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      data.productId,
      "product ID"
    );

    validateObjectId(
      data.colorId,
      "color ID"
    );

    validateObjectId(
      data.sizeId,
      "size ID"
    );

    const quantity =
      normalizeQuantity(
        data.quantity,
        1
      );

    /* =====================================================
       PRODUCT
    ===================================================== */

    const product =
      await Product.findById(
        data.productId
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    /*
     * IMPORTANT FIX:
     *
     * OLD:
     * product.status !== "active"
     *
     * NEW:
     * product.isActive
     */

    if (
      !isProductActive(
        product
      )
    ) {
      throw new Error(
        "Product is not available for purchase."
      );
    }

    /* =====================================================
       COLOR + SIZE
    ===================================================== */

    const {
      size,
    } =
      getVariant(
        product,
        data.colorId,
        data.sizeId
      );

    /* =====================================================
       CART
    ===================================================== */

    const cart =
      await getOrCreateCart(
        userId
      );

    const existingItem =
      cart.items.find(
        (
          item
        ) =>
          String(
            item.product
          ) ===
            data.productId &&
          String(
            item.colorId
          ) ===
            data.colorId &&
          String(
            item.sizeId
          ) ===
            data.sizeId
      );

    const nextQuantity =
      existingItem
        ? Number(
            existingItem.quantity
          ) +
          quantity
        : quantity;

    if (
      nextQuantity >
      99
    ) {
      throw new Error(
        "Maximum cart quantity is 99."
      );
    }

    /* =====================================================
       STOCK
    ===================================================== */

    const availableStock =
      getAvailableStock(
        product,
        size
      );

    if (
      availableStock <
      nextQuantity
    ) {
      throw new Error(
        `Only ${availableStock} item(s) are available in stock.`
      );
    }

    /* =====================================================
       ADD / INCREASE
    ===================================================== */

    if (existingItem) {
      existingItem.quantity =
        nextQuantity;
    } else {
      cart.items.push({
        product:
          new Types.ObjectId(
            data.productId
          ),

        colorId:
          new Types.ObjectId(
            data.colorId
          ),

        sizeId:
          new Types.ObjectId(
            data.sizeId
          ),

        quantity,

        addedAt:
          new Date(),
      });
    }

    await cart.save();

    /* =====================================================
       ACTIVITY
    ===================================================== */

    await trackUserActivity({
      userId,

      type:
        "cart_add",

      productId:
        data.productId,

      metadata: {
        colorId:
          data.colorId,

        sizeId:
          data.sizeId,

        quantity,

        finalQuantity:
          nextQuantity,
      },
    });

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   GET CART
========================================================= */

export const getUserCart =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   GET CART COUNT
========================================================= */

export const getCartCount =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await Cart.findOne({
        user:
          userId,
      });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity ||
            0
        ),
      0
    );
  };

/* =========================================================
   UPDATE ITEM QUANTITY
========================================================= */

export const updateCartItem =
  async (
    userId: string,
    cartItemId: string,
    data: UpdateCartItemData
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      cartItemId,
      "cart item ID"
    );

    const quantity =
      normalizeQuantity(
        data.quantity
      );

    const cart =
      await Cart.findOne({
        user:
          userId,
      });

    if (!cart) {
      throw new Error(
        "Cart not found."
      );
    }

    const item =
      cart.items.find(
        (
          value
        ) =>
          String(
            value._id
          ) ===
          cartItemId
      );

    if (!item) {
      throw new Error(
        "Cart item not found."
      );
    }

    /* =====================================================
       PRODUCT
    ===================================================== */

    const product =
      await Product.findById(
        item.product
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    if (
      !isProductActive(
        product
      )
    ) {
      throw new Error(
        "Product is not available for purchase."
      );
    }

    /* =====================================================
       VARIANT
    ===================================================== */

    const {
      size,
    } =
      getVariant(
        product,
        String(
          item.colorId
        ),
        String(
          item.sizeId
        )
      );

    /* =====================================================
       STOCK
    ===================================================== */

    const availableStock =
      getAvailableStock(
        product,
        size
      );

    if (
      availableStock <
      quantity
    ) {
      throw new Error(
        `Only ${availableStock} item(s) are available in stock.`
      );
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    const previousQuantity =
      Number(
        item.quantity ||
          0
      );

    item.quantity =
      quantity;

    await cart.save();

    await trackUserActivity({
      userId,

      type:
        "cart_update",

      productId:
        String(
          item.product
        ),

      metadata: {
        colorId:
          String(
            item.colorId
          ),

        sizeId:
          String(
            item.sizeId
          ),

        previousQuantity,

        quantity,
      },
    });

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   REMOVE ONE CART ITEM
========================================================= */

export const removeCartItem =
  async (
    userId: string,
    cartItemId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      cartItemId,
      "cart item ID"
    );

    const cart =
      await Cart.findOne({
        user:
          userId,
      });

    if (!cart) {
      throw new Error(
        "Cart not found."
      );
    }

    const removedItem =
      cart.items.find(
        (
          item
        ) =>
          String(
            item._id
          ) ===
          cartItemId
      );

    if (!removedItem) {
      throw new Error(
        "Cart item not found."
      );
    }

    cart.items =
      cart.items.filter(
        (
          item
        ) =>
          String(
            item._id
          ) !==
          cartItemId
      );

    await cart.save();

    await trackUserActivity({
      userId,

      type:
        "cart_remove",

      productId:
        String(
          removedItem.product
        ),

      metadata: {
        colorId:
          String(
            removedItem.colorId
          ),

        sizeId:
          String(
            removedItem.sizeId
          ),

        quantity:
          Number(
            removedItem.quantity ||
              0
          ),

        addedAt:
          removedItem.addedAt,
      },
    });

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   CLEAR CART
========================================================= */

export const clearUserCart =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    const clearedItems =
      cart.items.length;

    cart.items =
      [];

    cart.discountCode =
      "";

    await cart.save();

    if (
      clearedItems >
      0
    ) {
      await trackUserActivity({
        userId,

        type:
          "cart_clear",

        metadata: {
          clearedItems,
        },
      });
    }

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   APPLY DISCOUNT CODE
========================================================= */

export const applyCartDiscountCode =
  async (
    userId: string,
    rawCode: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const code =
      String(
        rawCode ||
          ""
      )
        .trim()
        .toUpperCase();

    if (!code) {
      throw new Error(
        "Enter a discount code."
      );
    }

    const coupon =
      await DiscountCode.findOne({
        code,

        isActive:
          true,
      }).lean();

    if (!coupon) {
      throw new Error(
        "Discount code is invalid or inactive."
      );
    }

    const now =
      new Date();

    if (
      coupon.startsAt &&
      new Date(
        coupon.startsAt
      ) >
        now
    ) {
      throw new Error(
        "Discount code is not active yet."
      );
    }

    if (
      coupon.endsAt &&
      new Date(
        coupon.endsAt
      ) <
        now
    ) {
      throw new Error(
        "Discount code has expired."
      );
    }

    const cart =
      await getOrCreateCart(
        userId
      );

    cart.discountCode =
      code;

    await cart.save();

    const response =
      await buildCartResponse(
        cart
      );

    if (
      response.codeDiscount <=
      0
    ) {
      cart.discountCode =
        "";

      await cart.save();

      throw new Error(
        "This discount code is not valid for products in your cart."
      );
    }

    return response;
  };

/* =========================================================
   REMOVE DISCOUNT CODE
========================================================= */

export const removeCartDiscountCode =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    cart.discountCode =
      "";

    await cart.save();

    return buildCartResponse(
      cart
    );
  };