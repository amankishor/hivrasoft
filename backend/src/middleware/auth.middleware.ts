import {
  Request,
  Response,
  NextFunction,
} from "express";

import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const decoded =
      verifyToken(token);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const user =
      await User.findById(
        decoded.id
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Account is disabled",
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired session",
    });
  }
};