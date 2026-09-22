import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

import categoryRoutes from "./routes/category.routes";

import productRoutes from "./routes/product.routes";
import uploadRoutes from "./routes/upload.routes";
import  addressRoutes from "./routes/user/address.routes"
import bannerRoutes from "./routes/banner.routes";
import wishlistRoutes from "./routes/wishlist.routes";

const app =
  express();

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin:
      process.env
        .FRONTEND_URL ||
      "http://localhost:3000",

    credentials:
      true,
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit:
      "10mb",
  })
);

app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "10mb",
  })
);

/* =========================================================
   COOKIE PARSER
========================================================= */

app.use(
  cookieParser()
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (
    req,
    res
  ) => {
    return res
      .status(200)
      .json({
        success:
          true,

        message:
          "HivraSoft backend is working",
      });
  }
);

/* =========================================================
   AUTH
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);
app.use("/api/admin", adminRoutes);

/* =========================================================
   CATEGORIES
========================================================= */

app.use(
  "/api/categories",
  categoryRoutes
);

/* =========================================================
   PRODUCTS
========================================================= */

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/uploads",
  uploadRoutes
);
app.use(
  "/api/address",
  addressRoutes
);


app.use(
  "/api/banners",
  bannerRoutes
);
app.use(
  "/api/wishlist",
  wishlistRoutes
);

/* =========================================================
   404
========================================================= */

app.use(
  (
    req,
    res
  ) => {
    return res
      .status(404)
      .json({
        success:
          false,

        message:
          `Route not found: ${req.originalUrl}`,
      });
  }
);

export default app;
