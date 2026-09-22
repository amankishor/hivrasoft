import mongoose, {
  Types,
} from "mongoose";

import Cart, {
  ICart,
  ICartItem,
} from "../models/Cart.model";

import Product from "../models/Product.model";

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
   HELPERS
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

const getVariant = (
  product: any,
  colorId: string,
  sizeId: string
) => {
  const color =
    product.colors?.find(
      (item: any) =>
        String(
          item._id
        ) === colorId
    );

  if (!color) {
    throw new Error(
      "Selected product color was not found."
    );
  }

  if (!color.isActive) {
    throw new Error(
      "Selected product color is inactive."
    );
  }

  const size =
    color.sizes?.find(
      (item: any) =>
        String(
          item._id
        ) === sizeId
    );

  if (!size) {
    throw new Error(
      "Selected product size was not found."
    );
  }

  if (!size.isActive) {
    throw new Error(
      "Selected product size is inactive."
    );
  }

  return {
    color,
    size,
  };
};

const getAvailableStock = (
  product: any,
  size: any
) => {
  const productStock =
    Number(
      product.stock ?? 0
    );

  const sizeStock =
    Number(
      size.stock ?? 0
    );

  return Math.max(
    0,
    Math.min(
      productStock,
      sizeStock
    )
  );
};

const getOrCreateCart =
  async (
    userId: string
  ): Promise<ICart> => {
    let cart =
      await Cart.findOne({
        user: userId,
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

const buildCartResponse =
  async (
    cart: ICart
  ) => {
    const productIds =
      Array.from(
        new Set(
          cart.items.map(
            item =>
              String(
                item.product
              )
          )
        )
      );

    const products =
      productIds.length > 0
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
          product => [
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
        item => {
          const product =
            productMap.get(
              String(
                item.product
              )
            ) as any;

          const quantity =
            Number(
              item.quantity
            );

          totalItems +=
            quantity;

          if (!product) {
            return {
              _id:
                item._id,

              product: null,

              colorId:
                item.colorId,

              sizeId:
                item.sizeId,

              quantity,

              unitPrice: 0,

              subtotal: 0,

              available:
                false,

              unavailableReason:
                "Product no longer exists.",

              addedAt:
                item.addedAt,
            };
          }

          const color =
            product.colors?.find(
              (value: any) =>
                String(
                  value._id
                ) ===
                String(
                  item.colorId
                )
            );

          const size =
            color?.sizes?.find(
              (value: any) =>
                String(
                  value._id
                ) ===
                String(
                  item.sizeId
                )
            );

          const availableStock =
            color && size
              ? getAvailableStock(
                  product,
                  size
                )
              : 0;

          const available =
            product.status ===
              "active" &&
            Boolean(
              color?.isActive
            ) &&
            Boolean(
              size?.isActive
            ) &&
            availableStock >=
              quantity;

          const unitPrice =
            Number(
              product.price ??
                0
            );

          const itemSubtotal =
            unitPrice *
            quantity;

          if (available) {
            subtotal +=
              itemSubtotal;
          }

          return {
            _id:
              item._id,

            product: {
              _id:
                product._id,

              name:
                product.name,

              slug:
                product.slug,

              price:
                product.price,

              compareAtPrice:
                product.compareAtPrice,

              stock:
                product.stock,

              mainImages:
                product.mainImages ||
                [],

              status:
                product.status,
            },

            selectedColor:
              color
                ? {
                    _id:
                      color._id,

                    name:
                      color.name,

                    slug:
                      color.slug,

                    hex:
                      color.hex,

                    images:
                      color.images ||
                      [],

                    isActive:
                      color.isActive,
                  }
                : null,

            selectedSize:
              size
                ? {
                    _id:
                      size._id,

                    size:
                      size.size,

                    sku:
                      size.sku,

                    stock:
                      size.stock,

                    isActive:
                      size.isActive,
                  }
                : null,

            colorId:
              item.colorId,

            sizeId:
              item.sizeId,

            quantity,

            unitPrice,

            subtotal:
              itemSubtotal,

            availableStock,

            available,

            addedAt:
              item.addedAt,
          };
        }
      );

    return {
      _id:
        cart._id,

      user:
        cart.user,

      items,

      totalItems,

      subtotal,

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

    const product =
      await Product.findById(
        data.productId
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    if (
      product.status !==
      "active"
    ) {
      throw new Error(
        "Product is not available for purchase."
      );
    }

    const {
      size,
    } = getVariant(
      product,
      data.colorId,
      data.sizeId
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    const existingItem =
      cart.items.find(
        item =>
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
        ? existingItem.quantity +
          quantity
        : quantity;

    if (
      nextQuantity > 99
    ) {
      throw new Error(
        "Maximum cart quantity is 99."
      );
    }

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
        user: userId,
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
        item.quantity,
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
        user: userId,
      });

    if (!cart) {
      throw new Error(
        "Cart not found."
      );
    }

    const item =
      cart.items.find(
        value =>
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
      product.status !==
      "active"
    ) {
      throw new Error(
        "Product is not available for purchase."
      );
    }

    const {
      size,
    } = getVariant(
      product,
      String(
        item.colorId
      ),
      String(
        item.sizeId
      )
    );

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

    item.quantity =
      quantity;

    await cart.save();

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
        user: userId,
      });

    if (!cart) {
      throw new Error(
        "Cart not found."
      );
    }

    const itemExists =
      cart.items.some(
        item =>
          String(
            item._id
          ) ===
          cartItemId
      );

    if (!itemExists) {
      throw new Error(
        "Cart item not found."
      );
    }

    cart.items =
      cart.items.filter(
        item =>
          String(
            item._id
          ) !==
          cartItemId
      );

    await cart.save();

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

    cart.items = [];

    await cart.save();

    return buildCartResponse(
      cart
    );
  };
