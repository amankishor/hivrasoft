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

  subtitle: string;

  slug: string;

  description: string;

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

  customLink: string;

  /*
    Same Category model handles:

    Women
    └── Bra
        └── Sports Bra

    Root category ya subcategory,
    dono ka ObjectId yahan save ho sakta hai.
  */
  category:
    Types.ObjectId | null;

  product:
    Types.ObjectId | null;

  page:
    Types.ObjectId | null;

  buttonText: string;

  openInNewTab: boolean;

  /* PLACEMENT */

  position:
    BannerPosition;

  device:
    BannerDevice;

  sortOrder: number;

  /* SCHEDULE */

  startAt:
    Date | null;

  endAt:
    Date | null;

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

        default:
          undefined,
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
         BASIC DETAILS
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

        match: [
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Banner slug must contain only lowercase letters, numbers and hyphens.",
        ],
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
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
         IMAGE ARRAY
      ===================================================== */

      images: {
        type: [
          bannerImageSchema,
        ],

        default: [],
      },

      /* =====================================================
         VIDEO ARRAY
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

         Same Category collection.

         Example:

         Women            level 0
         └── Bra          level 1
             └── Sports   level 2

         Kisi bhi level ki category ka ID save hoga.
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
         PRODUCT
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
         PAGE
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
         BUTTON
      ===================================================== */

      buttonText: {
        type: String,
        default: "Shop Now",
        trim: true,
        maxlength: 100,
      },

      openInNewTab: {
        type: Boolean,
        default: false,
      },

      /* =====================================================
         BANNER POSITION
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
        default: null,
      },

      endAt: {
        type: Date,
        default: null,
      },

      /* =====================================================
         ACTIVE
      ===================================================== */

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   VALIDATION
========================================================= */

bannerSchema.pre(
  "validate",
  function () {
    /* =====================================================
       IMAGE BANNER
    ===================================================== */

    if (
      this.mediaType ===
      "image"
    ) {
      if (
        !Array.isArray(
          this.images
        ) ||
        this.images.length ===
          0
      ) {
        throw new Error(
          "Image banner requires at least one image."
        );
      }

      /*
        Image banner me old video accidentally
        save nahi rehna chahiye.
      */

      this.videos = [];
    }

    /* =====================================================
       VIDEO BANNER
    ===================================================== */

    if (
      this.mediaType ===
      "video"
    ) {
      if (
        !Array.isArray(
          this.videos
        ) ||
        this.videos.length ===
          0
      ) {
        throw new Error(
          "Video banner requires at least one video."
        );
      }

      /*
        Video banner me old image accidentally
        save nahi rehni chahiye.
      */

      this.images = [];
    }

    /* =====================================================
       LINK VALIDATION
    ===================================================== */

    if (
      this.linkType ===
      "custom"
    ) {
      if (
        !this.customLink
          ?.trim()
      ) {
        throw new Error(
          "Custom link is required."
        );
      }

      this.category =
        null;

      this.product =
        null;

      this.page =
        null;
    }

    if (
      this.linkType ===
      "category"
    ) {
      if (
        !this.category
      ) {
        throw new Error(
          "Category is required."
        );
      }

      this.customLink =
        "";

      this.product =
        null;

      this.page =
        null;
    }

    if (
      this.linkType ===
      "product"
    ) {
      if (
        !this.product
      ) {
        throw new Error(
          "Product is required."
        );
      }

      this.customLink =
        "";

      this.category =
        null;

      this.page =
        null;
    }

    if (
      this.linkType ===
      "page"
    ) {
      if (
        !this.page
      ) {
        throw new Error(
          "Page is required."
        );
      }

      this.customLink =
        "";

      this.category =
        null;

      this.product =
        null;
    }

    if (
      this.linkType ===
      "none"
    ) {
      this.customLink =
        "";

      this.category =
        null;

      this.product =
        null;

      this.page =
        null;
    }

    /* =====================================================
       SCHEDULE VALIDATION
    ===================================================== */

    if (
      this.startAt &&
      this.endAt &&
      this.endAt <
        this.startAt
    ) {
      throw new Error(
        "Banner end date cannot be before start date."
      );
    }
  }
);

/* =========================================================
   INDEXES
========================================================= */

/*
  slug me unique:true already index create karega,
  isliye slug ka separate index dobara nahi banana.
*/

bannerSchema.index({
  isActive: 1,
});

bannerSchema.index({
  category: 1,
});

bannerSchema.index({
  product: 1,
});

bannerSchema.index({
  page: 1,
});

bannerSchema.index({
  position: 1,
  device: 1,
  isActive: 1,
  sortOrder: 1,
});

bannerSchema.index({
  startAt: 1,
  endAt: 1,
});

/* =========================================================
   MODEL
========================================================= */

const Banner =
  (
    mongoose.models
      .Banner as
      Model<IBanner>
  ) ||
  mongoose.model<IBanner>(
    "Banner",
    bannerSchema
  );

export default Banner;