import {
  Request,
  Response,
} from "express";

import {
  createBanner,
  getAllBanners,
  getBannerById,
  getBannerBySlug,
  updateBanner,
  getActiveBanners,
} from "../services/banner.service";

/* =========================================================
   HELPER - ROUTE PARAM
========================================================= */

const getRouteParam = (
  value:
    | string
    | string[]
    | undefined,

  paramName: string
): string => {
  if (!value) {
    throw new Error(
      `${paramName} is required.`
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    if (!value[0]) {
      throw new Error(
        `${paramName} is required.`
      );
    }

    return value[0];
  }

  return value;
};

/* =========================================================
   CREATE BANNER
========================================================= */

export const createBannerController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const banner =
        await createBanner(
          req.body
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Banner created successfully.",

          data:
            banner,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to create banner.",
        });
    }
  };

/* =========================================================
   GET ALL BANNERS
========================================================= */

export const getAllBannersController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const banners =
        await getAllBanners();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Banners fetched successfully.",

          count:
            banners.length,

          data:
            banners,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to fetch banners.",
        });
    }
  };

/* =========================================================
   GET ONE BANNER BY ID
========================================================= */

export const getBannerByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const bannerId =
        getRouteParam(
          req.params.id,
          "Banner ID"
        );

      const banner =
        await getBannerById(
          bannerId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Banner fetched successfully.",

          data:
            banner,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Banner not found.",
        });
    }
  };

/* =========================================================
   GET ONE BANNER BY SLUG
========================================================= */

export const getBannerBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Banner slug"
        );

      const banner =
        await getBannerBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Banner fetched successfully.",

          data:
            banner,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Banner not found.",
        });
    }
  };

/* =========================================================
   UPDATE / EDIT BANNER
========================================================= */

export const updateBannerController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const bannerId =
        getRouteParam(
          req.params.id,
          "Banner ID"
        );

      const banner =
        await updateBanner(
          bannerId,
          req.body
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Banner updated successfully.",

          data:
            banner,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to update banner.",
        });
    }
  };

/* =========================================================
   GET ACTIVE BANNERS - WEBSITE
========================================================= */

export const getActiveBannersController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const position =
        typeof req.query.position ===
        "string"
          ? req.query.position
          : undefined;

      const device =
        typeof req.query.device ===
        "string"
          ? req.query.device
          : undefined;

      const banners =
        await getActiveBanners(
          position,
          device
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Active banners fetched successfully.",

          count:
            banners.length,

          data:
            banners,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to fetch active banners.",
        });
    }
  };