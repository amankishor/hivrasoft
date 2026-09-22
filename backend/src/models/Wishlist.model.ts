import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   WISHLIST ITEM
========================================================= */

export interface IWishlistItem {
  product: Types.ObjectId;
  addedAt: Date;
}

/* =========================================================
   WISHLIST
========================================================= */

export interface IWishlist extends Document {
  user: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   WISHLIST ITEM SCHEMA
========================================================= */

const wishlistItemSchema =
  new Schema<IWishlistItem>(
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   WISHLIST SCHEMA
========================================================= */

const wishlistSchema =
  new Schema<IWishlist>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      items: {
        type: [wishlistItemSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   PREVENT DUPLICATE PRODUCTS IN SAME WISHLIST
========================================================= */

wishlistSchema.pre(
  "validate",
  function () {
    const seen =
      new Set<string>();

    this.items =
      this.items.filter(
        (item) => {
          const productId =
            item.product.toString();

          if (
            seen.has(
              productId
            )
          ) {
            return false;
          }

          seen.add(
            productId
          );

          return true;
        }
      );
  }
);

/* =========================================================
   INDEX
========================================================= */

wishlistSchema.index({
  "items.product": 1,
});

/* =========================================================
   MODEL
========================================================= */

const Wishlist: Model<IWishlist> =
  (mongoose.models
    .Wishlist as
    Model<IWishlist>) ||
  mongoose.model<IWishlist>(
    "Wishlist",
    wishlistSchema
  );

export default Wishlist;
