import { apiUrl, getApiBaseUrl } from "@/utils/api-base-url";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_COUNT = 5;
// Legacy constants retained for brownfield compatibility. Supported services use utils/api-base-url.ts.
export const getLegacyApiBaseUrl = () => getApiBaseUrl();
export const getLegacyApiEndpoints = () => ({
  login: apiUrl("/auth/login"),
  register: apiUrl("/auth/register"),
  refresh: apiUrl("/auth/refresh-token"),
  verify: apiUrl("/auth/verify-email"),
});

export const URL = {
  toString: () => getLegacyApiBaseUrl(),
  valueOf: () => getLegacyApiBaseUrl(),
};

export const API_ENDPOINTS = {
  get login() {
    return apiUrl("/auth/login");
  },
  get register() {
    return apiUrl("/auth/register");
  },
  get refresh() {
    return apiUrl("/auth/refresh-token");
  },
  get verify() {
    return apiUrl("/auth/verify-email");
  },
};
