import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export type BannerMediaType =
  | "image"
  | "video";

export type BannerLinkType =
  | "none"
  | "custom"
  | "category"
  | "product"
  | "page";

export type BannerDevice =
  | "all"
  | "desktop"
  | "mobile";

export type BannerPosition =
  | "home_hero"
  | "home_top"
  | "home_middle"
  | "home_bottom"
  | "category_top"
  | "category_middle";

/* =========================================================
   IMAGE
========================================================= */

export interface IBannerImage {
  url: string;

  publicId: string;

  alt: string;
}

/* =========================================================
   VIDEO POSTER
========================================================= */

export interface IBannerVideoPoster {
  url: string;

  publicId: string;
}

/* =========================================================
   VIDEO
========================================================= */

export interface IBannerVideo {
  url: string;

  publicId: string;

  poster?: IBannerVideoPoster;

  autoplay: boolean;

  muted: boolean;

  loop: boolean;

  controls: boolean;
}

/* =========================================================
   BANNER
========================================================= */

export interface IBanner
  extends Document {
  /* BASIC */

  title: string;

  subtitle?: string;

  slug: string;

  description?: string;

  /* MEDIA */

  mediaType:
    BannerMediaType;

  images:
    IBannerImage[];

  videos:
    IBannerVideo[];

  /* LINK */

  linkType:
    BannerLinkType;

  customLink?: string;

  /*
    Root category aur subcategory
    dono same Category model use karenge.

    Example:

    Women
    └── Bra
        └── Sports Bra

    category field me kisi bhi level
    ka Category ObjectId save ho sakta hai.
  */
  category:
    Types.ObjectId | null;

  product:
    Types.ObjectId | null;

  page:
    Types.ObjectId | null;

  buttonText?: string;

  openInNewTab: boolean;

  /* PLACEMENT */

  position:
    BannerPosition;

  device:
    BannerDevice;

  sortOrder: number;

  /* SCHEDULE */

  startAt?: Date | null;

  endAt?: Date | null;

  /* STATUS */

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}

/* =========================================================
   IMAGE SCHEMA
========================================================= */

const bannerImageSchema =
  new Schema<IBannerImage>(
    {
      url: {
        type: String,

        required: true,

        trim: true,
      },

      publicId: {
        type: String,

        required: true,

        trim: true,
      },

      alt: {
        type: String,

        default: "",

        trim: true,

        maxlength: 200,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   VIDEO POSTER SCHEMA
========================================================= */

const bannerVideoPosterSchema =
  new Schema<IBannerVideoPoster>(
    {
      url: {
        type: String,

        default: "",

        trim: true,
      },

      publicId: {
        type: String,

        default: "",

        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   VIDEO SCHEMA
========================================================= */

const bannerVideoSchema =
  new Schema<IBannerVideo>(
    {
      url: {
        type: String,

        required: true,

        trim: true,
      },

      publicId: {
        type: String,

        required: true,

        trim: true,
      },

      poster: {
        type:
          bannerVideoPosterSchema,

        default: () => ({
          url: "",
          publicId: "",
        }),
      },

      autoplay: {
        type: Boolean,

        default: true,
      },

      muted: {
        type: Boolean,

        default: true,
      },

      loop: {
        type: Boolean,

        default: true,
      },

      controls: {
        type: Boolean,

        default: false,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   BANNER SCHEMA
========================================================= */

const bannerSchema =
  new Schema<IBanner>(
    {
      /* =====================================================
         BASIC
      ===================================================== */

      title: {
        type: String,

        required: true,

        trim: true,

        maxlength: 200,
      },

      subtitle: {
        type: String,

        default: "",

        trim: true,

        maxlength: 300,
      },

      slug: {
        type: String,

        required: true,

        unique: true,

        lowercase: true,

        trim: true,

        maxlength: 250,
      },

      description: {
        type: String,

        default: "",

        trim: true,

        maxlength: 1000,
      },

      /* =====================================================
         MEDIA TYPE
      ===================================================== */

      mediaType: {
        type: String,

        enum: [
          "image",
          "video",
        ],

        required: true,

        default:
          "image",
      },

      /* =====================================================
         IMAGES
      ===================================================== */

      images: {
        type: [
          bannerImageSchema,
        ],

        default: [],
      },

      /* =====================================================
         VIDEOS
      ===================================================== */

      videos: {
        type: [
          bannerVideoSchema,
        ],

        default: [],
      },

      /* =====================================================
         LINK TYPE
      ===================================================== */

      linkType: {
        type: String,

        enum: [
          "none",
          "custom",
          "category",
          "product",
          "page",
        ],

        default:
          "none",
      },

      /* =====================================================
         CUSTOM LINK
      ===================================================== */

      customLink: {
        type: String,

        default: "",

        trim: true,
      },

      /* =====================================================
         CATEGORY / SUBCATEGORY

         Same Category model.

         Root:
         Women

         Child:
         Bra

         Grand Child:
         Sports Bra

         kisi bhi Category ID ko yahan save kar sakte ho.
      ===================================================== */

      category: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Category",

        default:
          null,
      },

      /* =====================================================
         PRODUCT LINK
      ===================================================== */

      product: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        default:
          null,
      },

      /* =====================================================
         PAGE LINK
      ===================================================== */

      page: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Page",

        default:
          null,
      },

      /* =====================================================
         CTA BUTTON
      ===================================================== */

      buttonText: {
        type: String,

        default:
          "Shop Now",

        trim: true,

        maxlength: 100,
      },

      openInNewTab: {
        type: Boolean,

        default:
          false,
      },

      /* =====================================================
         POSITION
      ===================================================== */

      position: {
        type: String,

        enum: [
          "home_hero",
          "home_top",
          "home_middle",
          "home_bottom",
          "category_top",
          "category_middle",
        ],

        default:
          "home_hero",
      },

      /* =====================================================
         DEVICE
      ===================================================== */

      device: {
        type: String,

        enum: [
          "all",
          "desktop",
          "mobile",
        ],

        default:
          "all",
      },

      /* =====================================================
         SORT ORDER
      ===================================================== */

      sortOrder: {
        type: Number,

        default: 0,

        min: 0,
      },

      /* =====================================================
         SCHEDULE
      ===================================================== */

      startAt: {
        type: Date,

        default:
          null,
      },

      endAt: {
        type: Date,

        default:
          null,
      },

      /* =====================================================
         STATUS
      ===================================================== */

      isActive: {
        type: Boolean,

        default:
          true,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   VALIDATION

   IMAGE BANNER -> at least one image

   VIDEO BANNER -> at least one video
========================================================= */

bannerSchema.pre(
  "validate",
  function (
    next
  ) {
    if (
      this.mediaType ===
        "image" &&
      (
        !Array.isArray(
          this.images
        ) ||
        this.images.length ===
          0
      )
    ) {
      return next(
        new Error(
          "Image banner requires at least one image."
        )
      );
    }

    if (
      this.mediaType ===
        "video" &&
      (
        !Array.isArray(
          this.videos
        ) ||
        this.videos.length ===
          0
      )
    ) {
      return next(
        new Error(
          "Video banner requires at least one video."
        )
      );
    }

    /* ===============================================
       LINK VALIDATION
    =============================================== */

    if (
      this.linkType ===
        "custom" &&
      !this.customLink
    ) {
      return next(
        new Error(
          "Custom link is required."
        )
      );
    }

    if (
      this.linkType ===
        "category" &&
      !this.category
    ) {
      return next(
        new Error(
          "Category is required for category banner link."
        )
      );
    }

    if (
      this.linkType ===
        "product" &&
      !this.product
    ) {
      return next(
        new Error(
          "Product is required for product banner link."
        )
      );
    }

    if (
      this.linkType ===
        "page" &&
      !this.page
    ) {
      return next(
        new Error(
          "Page is required for page banner link."
        )
      );
    }

    /* ===============================================
       DATE VALIDATION
    =============================================== */

    if (
      this.startAt &&
      this.endAt &&
      this.endAt <
        this.startAt
    ) {
      return next(
        new Error(
          "Banner end date cannot be before start date."
        )
      );
    }

    next();
  }
);

/* =========================================================
   INDEXES
========================================================= */

bannerSchema.index({
  isActive: 1,
});

bannerSchema.index({
  position: 1,
});

bannerSchema.index({
  device: 1,
});

bannerSchema.index({
  sortOrder: 1,
});

bannerSchema.index({
  startAt: 1,
  endAt: 1,
});

bannerSchema.index({
  position: 1,
  isActive: 1,
  sortOrder: 1,
});

bannerSchema.index({
  category: 1,
});

bannerSchema.index({
  product: 1,
});

/* =========================================================
   MODEL
========================================================= */

const Banner:
  Model<IBanner> =
  mongoose.models.Banner ||
  mongoose.model<IBanner>(
    "Banner",
    bannerSchema
  );

export default Banner;