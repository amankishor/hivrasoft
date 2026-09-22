import {
  Types,
} from "mongoose";

import Wishlist from "../models/Wishlist.model";
import Product from "../models/Product.model";

/* =========================================================
   POPULATE CONFIG
========================================================= */

const WISHLIST_PRODUCT_SELECT =
  [
    "name",
    "slug",
    "shortDescription",
    "price",
    "compareAtPrice",
    "stock",
    "mainImages",
    "colors",
    "ratings",
    "status",
    "isFeatured",
    "isNewLaunch",
  ].join(" ");

/* =========================================================
   HELPERS
========================================================= */

const validateObjectId = (
  value: string,
  fieldName: string
) => {
  if (
    !Types.ObjectId.isValid(
      value
    )
  ) {
    throw new Error(
      `Invalid ${fieldName} ID.`
    );
  }
};

const populateWishlistById =
  async (
    wishlistId:
      | string
      | Types.ObjectId
  ) => {
    return Wishlist.findById(
      wishlistId
    ).populate({
      path: "items.product",
      select:
        WISHLIST_PRODUCT_SELECT,
    });
  };

const createEmptyWishlistResponse = (
  userId: string
) => ({
  _id: null,
  user: userId,
  items: [],
  createdAt: null,
  updatedAt: null,
});

/* =========================================================
   ADD PRODUCT TO WISHLIST
========================================================= */

export const addProductToWishlist =
  async (
    userId: string,
    productId: string
  ) => {
    validateObjectId(
      userId,
      "user"
    );

    validateObjectId(
      productId,
      "product"
    );

    /* =====================================================
       PRODUCT MUST EXIST AND BE ACTIVE
    ===================================================== */

    const product =
      await Product.findOne({
        _id: productId,
        status: "active",
      })
        .select("_id")
        .lean();

    if (!product) {
      throw new Error(
        "Active product not found."
      );
    }

    const userObjectId =
      new Types.ObjectId(
        userId
      );

    const productObjectId =
      new Types.ObjectId(
        productId
      );

    let wishlist =
      await Wishlist.findOne({
        user: userObjectId,
      });

    /* =====================================================
       FIRST WISHLIST ITEM
    ===================================================== */

    if (!wishlist) {
      wishlist =
        await Wishlist.create({
          user:
            userObjectId,

          items: [
            {
              product:
                productObjectId,
              addedAt:
                new Date(),
            },
          ],
        });

      return {
        wishlist:
          await populateWishlistById(
            wishlist._id
          ),

        alreadyExists:
          false,
      };
    }

    /* =====================================================
       ALREADY IN WISHLIST
    ===================================================== */

    const alreadyExists =
      wishlist.items.some(
        (item) =>
          item.product.equals(
            productObjectId
          )
      );

    if (alreadyExists) {
      return {
        wishlist:
          await populateWishlistById(
            wishlist._id
          ),

        alreadyExists:
          true,
      };
    }

    /* =====================================================
       ADD ITEM
    ===================================================== */

    wishlist.items.push({
      product:
        productObjectId,
      addedAt:
        new Date(),
    });

    await wishlist.save();

    return {
      wishlist:
        await populateWishlistById(
          wishlist._id
        ),

      alreadyExists:
        false,
    };
  };

/* =========================================================
   GET LOGGED-IN USER WISHLIST
========================================================= */

export const getUserWishlist =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user"
    );

    const wishlist =
      await Wishlist.findOne({
        user:
          new Types.ObjectId(
            userId
          ),
      }).populate({
        path: "items.product",
        select:
          WISHLIST_PRODUCT_SELECT,
      });

    if (!wishlist) {
      return createEmptyWishlistResponse(
        userId
      );
    }

    return wishlist;
  };

/* =========================================================
   CHECK PRODUCT IN WISHLIST
========================================================= */

export const checkProductInWishlist =
  async (
    userId: string,
    productId: string
  ) => {
    validateObjectId(
      userId,
      "user"
    );

    validateObjectId(
      productId,
      "product"
    );

    const exists =
      await Wishlist.exists({
        user:
          new Types.ObjectId(
            userId
          ),

        "items.product":
          new Types.ObjectId(
            productId
          ),
      });

    return Boolean(
      exists
    );
  };

/* =========================================================
   REMOVE ONE PRODUCT
========================================================= */

export const removeProductFromWishlist =
  async (
    userId: string,
    productId: string
  ) => {
    validateObjectId(
      userId,
      "user"
    );

    validateObjectId(
      productId,
      "product"
    );

    const wishlist =
      await Wishlist.findOne({
        user:
          new Types.ObjectId(
            userId
          ),
      });

    if (!wishlist) {
      throw new Error(
        "Wishlist not found."
      );
    }

    const beforeCount =
      wishlist.items.length;

    wishlist.items =
      wishlist.items.filter(
        (item) =>
          !item.product.equals(
            new Types.ObjectId(
              productId
            )
          )
      );

    if (
      wishlist.items.length ===
      beforeCount
    ) {
      throw new Error(
        "Product is not in wishlist."
      );
    }

    await wishlist.save();

    return populateWishlistById(
      wishlist._id
    );
  };

/* =========================================================
   CLEAR WISHLIST
========================================================= */

export const clearUserWishlist =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user"
    );

    const wishlist =
      await Wishlist.findOne({
        user:
          new Types.ObjectId(
            userId
          ),
      });

    if (!wishlist) {
      return createEmptyWishlistResponse(
        userId
      );
    }

    wishlist.items = [];

    await wishlist.save();

    return populateWishlistById(
      wishlist._id
    );
  };
