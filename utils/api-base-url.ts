const DEFAULT_LOCAL_API_BASE_URL = "/api/v1";
const REQUIRED_API_SUFFIX = "/api/v1";

let cachedApiBaseUrl: string | null = null;
let warnedAboutLocalFallback = false;

const normalizeApiBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const assertSupportedApiBaseUrl = (value: string): string => {
  const normalizedValue = normalizeApiBaseUrl(value);

  if (!normalizedValue.endsWith(REQUIRED_API_SUFFIX)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must include ${REQUIRED_API_SUFFIX}. Example: ${DEFAULT_LOCAL_API_BASE_URL}`
    );
  }

  return normalizedValue;
};

export const getApiBaseUrl = (): string => {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiBaseUrl) {
    cachedApiBaseUrl = assertSupportedApiBaseUrl(configuredApiBaseUrl);
    return cachedApiBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    if (!warnedAboutLocalFallback) {
      console.warn(
        `NEXT_PUBLIC_API_URL is not set. Slice 1 local development expects NEXT_PUBLIC_API_URL=${DEFAULT_LOCAL_API_BASE_URL}. Falling back to the documented local default.`
      );
      warnedAboutLocalFallback = true;
    }

    cachedApiBaseUrl = DEFAULT_LOCAL_API_BASE_URL;
    return cachedApiBaseUrl;
  }

  throw new Error(
    `NEXT_PUBLIC_API_URL is required and must include ${REQUIRED_API_SUFFIX}.`
  );
};

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

export const SUPPORTED_LOCAL_API_BASE_URL = DEFAULT_LOCAL_API_BASE_URL;
