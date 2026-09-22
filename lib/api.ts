export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(
    message: string,
    status: number,
    payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function getMessage(
  payload: unknown,
  fallback: string
) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
    credentials: options.credentials ?? "include",
    cache: options.cache ?? "no-store",
  });

  const contentType =
    response.headers.get("content-type") || "";

  let payload: unknown = null;

  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    throw new ApiError(
      getMessage(
        payload,
        `Request failed with status ${response.status}.`
      ),
      response.status,
      payload
    );
  }

  return payload as T;
}

export function requestLogin() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("hivrasoft-auth-required")
    );
  }
}
