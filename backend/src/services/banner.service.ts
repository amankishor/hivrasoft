import mongoose from "mongoose";

import Banner from "../models/Banner.model";

/* =========================================================
   TYPES
========================================================= */

interface CreateBannerData {
  title: string;

  subtitle?: string;

  slug: string;

  description?: string;

  mediaType:
    | "image"
    | "video";

  images?: {
    url: string;
    publicId: string;
    alt?: string;
  }[];

  videos?: {
    url: string;
    publicId: string;

    poster?: {
      url: string;
      publicId: string;
    };

    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
  }[];

  linkType?:
    | "none"
    | "custom"
    | "category"
    | "product"
    | "page";

  customLink?: string;

  category?: string | null;

  product?: string | null;

  page?: string | null;

  buttonText?: string;

  openInNewTab?: boolean;

  position?:
    | "home_hero"
    | "home_top"
    | "home_middle"
    | "home_bottom"
    | "category_top"
    | "category_middle";

  device?:
    | "all"
    | "desktop"
    | "mobile";

  sortOrder?: number;

  startAt?: Date | string | null;

  endAt?: Date | string | null;

  isActive?: boolean;
}

/* =========================================================
   CREATE BANNER
========================================================= */

export const createBanner =
  async (
    data: CreateBannerData
  ) => {
    const existingBanner =
      await Banner.findOne({
        slug:
          data.slug
            .toLowerCase()
            .trim(),
      });

    if (existingBanner) {
      throw new Error(
        "Banner slug already exists."
      );
    }

    const banner =
      await Banner.create({
        ...data,

        slug:
          data.slug
            .toLowerCase()
            .trim(),

        category:
          data.category ||
          null,

        product:
          data.product ||
          null,

        page:
          data.page ||
          null,
      });

    return banner;
  };

/* =========================================================
   GET ALL BANNERS
========================================================= */

export const getAllBanners =
  async () => {
    const banners =
      await Banner.find()
        .populate(
          "category",
          "name slug image level parent"
        )
        .populate(
          "product",
          "name slug price mainImages status"
        )
        .populate(
          "page"
        )
        .sort({
          sortOrder: 1,
          createdAt: -1,
        });

    return banners;
  };

/* =========================================================
   GET BANNER BY ID
========================================================= */

export const getBannerById =
  async (
    bannerId: string
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        bannerId
      )
    ) {
      throw new Error(
        "Invalid banner ID."
      );
    }

    const banner =
      await Banner.findById(
        bannerId
      )
        .populate(
          "category",
          "name slug image level parent"
        )
        .populate(
          "product",
          "name slug price mainImages status"
        )
        .populate(
          "page"
        );

    if (!banner) {
      throw new Error(
        "Banner not found."
      );
    }

    return banner;
  };

/* =========================================================
   GET BANNER BY SLUG
========================================================= */

export const getBannerBySlug =
  async (
    slug: string
  ) => {
    const banner =
      await Banner.findOne({
        slug:
          slug
            .toLowerCase()
            .trim(),
      })
        .populate(
          "category",
          "name slug image level parent"
        )
        .populate(
          "product",
          "name slug price mainImages status"
        )
        .populate(
          "page"
        );

    if (!banner) {
      throw new Error(
        "Banner not found."
      );
    }

    return banner;
  };

/* =========================================================
   UPDATE BANNER
========================================================= */

export const updateBanner =
  async (
    bannerId: string,
    data: Partial<CreateBannerData>
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        bannerId
      )
    ) {
      throw new Error(
        "Invalid banner ID."
      );
    }

    const banner =
      await Banner.findById(
        bannerId
      );

    if (!banner) {
      throw new Error(
        "Banner not found."
      );
    }

    /* =====================================================
       SLUG CHECK
    ===================================================== */

    if (
      data.slug &&
      data.slug !==
        banner.slug
    ) {
      const existingBanner =
        await Banner.findOne({
          slug:
            data.slug
              .toLowerCase()
              .trim(),

          _id: {
            $ne: bannerId,
          },
        });

      if (existingBanner) {
        throw new Error(
          "Banner slug already exists."
        );
      }

      banner.slug =
        data.slug
          .toLowerCase()
          .trim();
    }

    /* =====================================================
       BASIC
    ===================================================== */

    if (
      data.title !==
      undefined
    ) {
      banner.title =
        data.title;
    }

    if (
      data.subtitle !==
      undefined
    ) {
      banner.subtitle =
        data.subtitle;
    }

    if (
      data.description !==
      undefined
    ) {
      banner.description =
        data.description;
    }

    /* =====================================================
       MEDIA
    ===================================================== */

    if (
      data.mediaType !==
      undefined
    ) {
      banner.mediaType =
        data.mediaType;
    }

    if (
      data.images !==
      undefined
    ) {
      banner.images =
        data.images.map(
          image => ({
            url:
              image.url,

            publicId:
              image.publicId,

            alt:
              image.alt ||
              "",
          })
        );
    }

    if (
      data.videos !==
      undefined
    ) {
      banner.videos =
        data.videos.map(
          video => ({
            url:
              video.url,

            publicId:
              video.publicId,

            poster:
              video.poster,

            autoplay:
              video.autoplay ??
              true,

            muted:
              video.muted ??
              true,

            loop:
              video.loop ??
              true,

            controls:
              video.controls ??
              false,
          })
        );
    }

    /* =====================================================
       LINK
    ===================================================== */

    if (
      data.linkType !==
      undefined
    ) {
      banner.linkType =
        data.linkType;
    }

    if (
      data.customLink !==
      undefined
    ) {
      banner.customLink =
        data.customLink;
    }

    if (
      data.category !==
      undefined
    ) {
      banner.category =
        data.category
          ? new mongoose.Types.ObjectId(
              data.category
            )
          : null;
    }

    if (
      data.product !==
      undefined
    ) {
      banner.product =
        data.product
          ? new mongoose.Types.ObjectId(
              data.product
            )
          : null;
    }

    if (
      data.page !==
      undefined
    ) {
      banner.page =
        data.page
          ? new mongoose.Types.ObjectId(
              data.page
            )
          : null;
    }

    if (
      data.buttonText !==
      undefined
    ) {
      banner.buttonText =
        data.buttonText;
    }

    if (
      data.openInNewTab !==
      undefined
    ) {
      banner.openInNewTab =
        data.openInNewTab;
    }

    /* =====================================================
       PLACEMENT
    ===================================================== */

    if (
      data.position !==
      undefined
    ) {
      banner.position =
        data.position;
    }

    if (
      data.device !==
      undefined
    ) {
      banner.device =
        data.device;
    }

    if (
      data.sortOrder !==
      undefined
    ) {
      banner.sortOrder =
        data.sortOrder;
    }

    /* =====================================================
       SCHEDULE
    ===================================================== */

    if (
      data.startAt !==
      undefined
    ) {
      banner.startAt =
        data.startAt
          ? new Date(
              data.startAt
            )
          : null;
    }

    if (
      data.endAt !==
      undefined
    ) {
      banner.endAt =
        data.endAt
          ? new Date(
              data.endAt
            )
          : null;
    }

    /* =====================================================
       STATUS
    ===================================================== */

    if (
      data.isActive !==
      undefined
    ) {
      banner.isActive =
        data.isActive;
    }

    /*
      save() karne par tumhare model ka
      pre("validate") middleware bhi run hoga.

      Isliye:
      image -> videos clear
      video -> images clear
      linkType validation
      schedule validation
      sab automatically hoga.
    */

    await banner.save();

    const updatedBanner =
      await Banner.findById(
        banner._id
      )
        .populate(
          "category",
          "name slug image level parent"
        )
        .populate(
          "product",
          "name slug price mainImages status"
        )
        .populate(
          "page"
        );

    return updatedBanner;
  };

/* =========================================================
   GET ACTIVE BANNERS
========================================================= */

export const getActiveBanners =
  async (
    position?: string,
    device?: string
  ) => {
    const now =
      new Date();

    const filter: any = {
      isActive: true,

      $and: [
        {
          $or: [
            {
              startAt: null,
            },
            {
              startAt: {
                $lte: now,
              },
            },
          ],
        },

        {
          $or: [
            {
              endAt: null,
            },
            {
              endAt: {
                $gte: now,
              },
            },
          ],
        },
      ],
    };

    if (position) {
      filter.position =
        position;
    }

    if (
      device &&
      device !== "all"
    ) {
      filter.device = {
        $in: [
          "all",
          device,
        ],
      };
    }

    const banners =
      await Banner.find(
        filter
      )
        .populate(
          "category",
          "name slug image level parent"
        )
        .populate(
          "product",
          "name slug price mainImages status"
        )
        .populate(
          "page"
        )
        .sort({
          sortOrder: 1,
          createdAt: -1,
        });

    return banners;
  };