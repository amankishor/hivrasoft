import { Router, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

import { adminLogin } from "../controllers/admin.controller";
import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";

const router = Router();

router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many login attempts. Try again in 15 minutes.",
    },
  }),
  adminLogin
);

/**
 * Keep the /me auth handler local to this route.
 * This avoids CJS/ESM default-import interop returning a non-function
 * when running with tsx + Node 24.
 */
const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      res.status(401).json({
        success: false,
        message: "Invalid session",
      });
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
      return;
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
};

router.get("/me", authenticateAdmin, (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");

  return res.json({
    success: true,
    user: {
      id: String(req.user!._id),
      name: req.user!.name,
      role: req.user!.role,
    },
  });
});

export default router;
