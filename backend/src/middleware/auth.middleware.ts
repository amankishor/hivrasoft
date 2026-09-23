import {
  Request,
  Response,
  NextFunction,
} from "express";

import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message:
          "Not authenticated",
      });

      return;
    }

    const decoded =
      verifyToken(token);

    if (!decoded?.id) {
      res.status(401).json({
        success: false,
        message:
          "Invalid session",
      });

      return;
    }

    const user =
      await User.findById(
        decoded.id
      );

    if (!user) {
      res.status(401).json({
        success: false,
        message:
          "User not found",
      });

      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message:
          "Account is disabled",
      });

      return;
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "AUTH ERROR:",
      error
    );

    res.status(401).json({
      success: false,
      message:
        "Invalid or expired session",
    });

    return;
  }
};

export const protect =
  authenticate;

export {
  authenticate,
};

export default authenticate;