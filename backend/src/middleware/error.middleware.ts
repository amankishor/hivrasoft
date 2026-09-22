import {
  NextFunction,
  Request,
  Response,
} from "express";

const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  return res.status(500).json({
    success: false,
    message:
      error.message || "Internal server error",
  });
};

export default errorMiddleware;