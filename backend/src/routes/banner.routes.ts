import {
  Router,
} from "express";

import {
  createBannerController,
  getAllBannersController,
  getBannerByIdController,
  getBannerBySlugController,
  updateBannerController,
  getActiveBannersController,
} from "../controllers/banner.controller";

const router =
  Router();

/* =========================================================
   CREATE BANNER
========================================================= */

router.post(
  "/",
  createBannerController
);

/* =========================================================
   GET ALL BANNERS
========================================================= */

router.get(
  "/",
  getAllBannersController
);

/* =========================================================
   GET ACTIVE BANNERS
========================================================= */

router.get(
  "/active",
  getActiveBannersController
);

/* =========================================================
   GET BY SLUG
========================================================= */

router.get(
  "/slug/:slug",
  getBannerBySlugController
);

/* =========================================================
   GET BY ID
========================================================= */

router.get(
  "/:id",
  getBannerByIdController
);

/* =========================================================
   UPDATE BANNER
========================================================= */

router.patch(
  "/:id",
  updateBannerController
);

export default router;