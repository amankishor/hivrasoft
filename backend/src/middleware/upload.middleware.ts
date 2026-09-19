import multer from "multer";

const storage =
  multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const fileFilter:
  multer.Options["fileFilter"] =
  (
    req,
    file,
    callback
  ) => {
    if (
      !allowedMimeTypes.includes(
        file.mimetype
      )
    ) {
      callback(
        new Error(
          "Only JPG, PNG, WEBP and AVIF images are allowed."
        )
      );

      return;
    }

    callback(
      null,
      true
    );
  };

export const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        10 *
        1024 *
        1024,
    },
  });