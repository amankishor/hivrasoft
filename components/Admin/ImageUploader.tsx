"use client";

import {
  useRef,
  useState,
} from "react";

type ImageValue = {
  url: string;
  publicId: string;
};

type ImageUploaderProps = {
  label: string;

  value: ImageValue;

  folder: string;

  onChange: (
    image: ImageValue
  ) => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function ImageUploader({
  label,
  value,
  folder,
  onChange,
}: ImageUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     SELECT + UPLOAD IMAGE
  ========================================================= */

  const handleFileChange =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError("");

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setError(
          "Please select JPG, PNG, WEBP or AVIF image."
        );

        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        setError(
          "Image must be smaller than 10MB."
        );

        return;
      }

      try {
        setUploading(true);

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        formData.append(
          "folder",
          folder
        );

        const response =
          await fetch(
            `${API_URL}/api/uploads/image`,
            {
              method: "POST",

              credentials:
                "include",

              body:
                formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Image upload failed."
          );
        }

        onChange({
          url:
            data.image.url,

          publicId:
            data.image.publicId,
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Image upload failed."
        );
      } finally {
        setUploading(false);

        if (
          inputRef.current
        ) {
          inputRef.current.value =
            "";
        }
      }
    };

  /* =========================================================
     REMOVE
  ========================================================= */

  const handleRemove = () => {
    onChange({
      url: "",
      publicId: "",
    });
  };

  return (
    <div
      className="
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-[#FAF8F6]
        p-4
      "
    >
      <div
        className="
          mb-3
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-[10px]
            font-semibold
            text-[#211A18]
          "
        >
          {label}
        </p>

        {value.url && (
          <button
            type="button"
            onClick={
              handleRemove
            }
            className="
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.1em]
              text-red-500
            "
          >
            Remove
          </button>
        )}
      </div>

      {/* IMAGE PREVIEW */}

      {value.url ? (
        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[14px]
            border
            border-[#211A18]/10
            bg-white
          "
        >
          <div
            className="
              relative
              aspect-[4/5]
              w-full
              overflow-hidden
              bg-[#F3EEE8]
            "
          >
            <img
              src={value.url}
              alt={label}
              className="
                h-full
                w-full
                object-cover
                object-center
              "
            />

            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black/0
                opacity-0
                transition
                group-hover:bg-black/30
                group-hover:opacity-100
              "
            >
              <button
                type="button"
                onClick={() =>
                  inputRef.current?.click()
                }
                className="
                  rounded-[10px]
                  bg-white
                  px-4
                  py-3
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]
                "
              >
                Replace Image
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={
            uploading
          }
          onClick={() =>
            inputRef.current?.click()
          }
          className="
            flex
            aspect-[4/5]
            w-full
            flex-col
            items-center
            justify-center
            rounded-[14px]
            border
            border-dashed
            border-[#211A18]/20
            bg-white
            text-center
            transition

            hover:border-[#8C1839]
            hover:bg-[#FFF9F9]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {uploading ? (
            <>
              <span
                className="
                  h-7
                  w-7
                  animate-spin
                  rounded-full
                  border-2
                  border-[#211A18]/10
                  border-t-[#8C1839]
                "
              />

              <span
                className="
                  mt-3
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-[#211A18]/50
                "
              >
                Uploading...
              </span>
            </>
          ) : (
            <>
              <UploadIcon />

              <span
                className="
                  mt-3
                  text-[10px]
                  font-semibold
                  text-[#211A18]
                "
              >
                Choose Image
              </span>

              <span
                className="
                  mt-1
                  text-[8px]
                  text-[#211A18]/40
                "
              >
                JPG, PNG, WEBP, AVIF
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="
          image/jpeg,
          image/png,
          image/webp,
          image/avif
        "
        onChange={
          handleFileChange
        }
        className="hidden"
      />

      {error && (
        <p
          className="
            mt-3
            text-[9px]
            leading-4
            text-red-500
          "
        >
          {error}
        </p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="
        text-[#8C1839]
      "
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}