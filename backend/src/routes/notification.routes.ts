import { Router, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

import {
  adminLogin,
  getAdminCustomers,
  getAdminCustomerDetails,
  getAdminCustomerActivity,
  getAdminDashboard,
  getAdminOrders,
  getAdminSystemStatus,
  updateAdminCustomerStatus,
  updateAdminOrderStatus,
} from "../controllers/admin.controller";
import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";

import {
  createAdminNotification,
  listAdminNotifications,
  deleteAdminNotification,
} from "../controllers/notification.controller";

import {
  getDiscountProducts,
  getAutomaticDiscount,
  saveAutomaticDiscount,
  listDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "../controllers/discount.controller";


const router = Router();

router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
  }),
  adminLogin
);

const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      res.status(401).json({ success: false, message: "Invalid session" });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Account is disabled" });
      return;
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      res.status(403).json({ success: false, message: "Admin access required." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);
    res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
};

router.get("/me", authenticateAdmin, (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    success: true,
    user: {
      id: String(req.user!._id),
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

router.get("/dashboard", authenticateAdmin, getAdminDashboard);
router.get("/customers", authenticateAdmin, getAdminCustomers);
router.get("/customers/:id", authenticateAdmin, getAdminCustomerDetails);
router.get("/customers/:id/activity", authenticateAdmin, getAdminCustomerActivity);
router.patch("/customers/:id/status", authenticateAdmin, updateAdminCustomerStatus);
router.get("/orders", authenticateAdmin, getAdminOrders);
router.patch("/orders/:id/status", authenticateAdmin, updateAdminOrderStatus);
router.get("/system-status", authenticateAdmin, getAdminSystemStatus);

router.get("/notifications", authenticateAdmin, listAdminNotifications);
router.post("/notifications", authenticateAdmin, createAdminNotification);
router.delete("/notifications/:id", authenticateAdmin, deleteAdminNotification);

router.get("/discounts/products", authenticateAdmin, getDiscountProducts);
router.get("/discounts/automatic", authenticateAdmin, getAutomaticDiscount);
router.put("/discounts/automatic", authenticateAdmin, saveAutomaticDiscount);
router.get("/discounts/codes", authenticateAdmin, listDiscountCodes);
router.post("/discounts/codes", authenticateAdmin, createDiscountCode);
router.patch("/discounts/codes/:id", authenticateAdmin, updateDiscountCode);
router.delete("/discounts/codes/:id", authenticateAdmin, deleteDiscountCode);

export default router;
