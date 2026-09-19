import {
  UploadApiResponse,
} from "cloudinary";

import configureCloudinary from "../config/cloudinary";

/* =========================================================
   UPLOAD IMAGE
========================================================= */

export const uploadImageBuffer = async (
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> => {
  const cloudinary =
    configureCloudinary();

  return new Promise(
    (
      resolve,
      reject
    ) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            unique_filename: true,
            overwrite: false,
          },
          (
            error,
            result
          ) => {
            if (
              error ||
              !result
            ) {
              reject(
                error ||
                  new Error(
                    "Cloudinary upload failed."
                  )
              );

              return;
            }

            resolve(result);
          }
        );

      uploadStream.end(
        buffer
      );
    }
  );
};

/* =========================================================
   DELETE IMAGE
========================================================= */

export const deleteCloudinaryImage =
  async (
    publicId: string
  ) => {
    if (!publicId) {
      throw new Error(
        "Cloudinary publicId is required."
      );
    }

    const cloudinary =
      configureCloudinary();

    return cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      }
    );
  };