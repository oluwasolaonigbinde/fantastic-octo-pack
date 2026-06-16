"use client";

import { apiUrl } from "@/utils/api-base-url";
import type {
  AdminKycListRow,
  AdminKycStats,
  AdminKycSubmissionDetail,
  KycApiEnvelope,
  KycSubmission,
  KycTierDefinition,
  KycUploadResponseData,
} from "@/types/kyc";

const parseError = async (response: Response, fallback: string): Promise<never> => {
  try {
    const payload = (await response.json()) as {
      message?: string;
      error?: { message?: string };
    };

    throw new Error(payload.message || payload.error?.message || fallback);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(fallback);
  }
};

const requestJson = async <T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<KycApiEnvelope<T>> => {
  const requestUrl = path.startsWith("http://") || path.startsWith("https://") ? path : apiUrl(path);

  const response = await fetch(requestUrl, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return parseError(response, "KYC request failed");
  }

  return (await response.json()) as KycApiEnvelope<T>;
};

export interface CreateKycSubmissionPayload {
  tierKey: string;
  textFields?: Record<string, string>;
  documents?: Array<{
    fieldName: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    cloudinaryId: string;
  }>;
}

export interface AdminKycFilters {
  status?: "all" | "pending" | "approved" | "rejected";
  userCategory?: "all" | "buyer" | "distributor" | "oem" | "engineer";
  date?: string;
  page?: number;
  limit?: number;
}

const kycService = {
  async getTiers(token: string) {
    return requestJson<KycTierDefinition[]>(token, "/kyc/tiers", {
      method: "GET",
    });
  },

  async getSubmissions(token: string) {
    return requestJson<KycSubmission[]>(token, "/kyc/submissions", {
      method: "GET",
    });
  },

  async getSubmission(token: string, id: string) {
    return requestJson<KycSubmission>(token, `/kyc/submissions/${id}`, {
      method: "GET",
    });
  },

  async createSubmission(token: string, payload: CreateKycSubmissionPayload) {
    return requestJson<KycSubmission>(token, "/kyc/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  async uploadDocument(token: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return requestJson<KycUploadResponseData>(token, "/kyc/upload", {
      method: "POST",
      body: formData,
    });
  },

  async getAdminSubmissions(token: string, filters: AdminKycFilters = {}) {
    const url = new URL(apiUrl("/kyc/admin/submissions"));

    if (filters.status && filters.status !== "all") {
      url.searchParams.set("status", filters.status);
    }
    if (filters.userCategory && filters.userCategory !== "all") {
      url.searchParams.set("userCategory", filters.userCategory);
    }
    if (filters.date) {
      url.searchParams.set("date", filters.date);
    }
    if (filters.page) {
      url.searchParams.set("page", String(filters.page));
    }
    if (filters.limit) {
      url.searchParams.set("limit", String(filters.limit));
    }

    return requestJson<
      | AdminKycListRow[]
      | {
          docs: AdminKycListRow[];
          totalDocs: number;
          limit: number;
          totalPages: number;
          page: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          nextPage: number | null;
          previousPage: number | null;
        }
    >(token, url.toString(), {
      method: "GET",
    });
  },

  async getAdminSubmission(token: string, id: string) {
    return requestJson<AdminKycSubmissionDetail>(token, `/kyc/admin/submissions/${id}`, {
      method: "GET",
    });
  },

  async approveAdminSubmission(token: string, id: string) {
    return requestJson<AdminKycSubmissionDetail>(
      token,
      `/kyc/admin/submissions/${id}/approve`,
      {
        method: "PATCH",
      },
    );
  },

  async rejectAdminSubmission(token: string, id: string, rejectionReason: string) {
    return requestJson<AdminKycSubmissionDetail>(
      token,
      `/kyc/admin/submissions/${id}/reject`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason }),
      },
    );
  },

  async getAdminStats(token: string) {
    return requestJson<AdminKycStats>(token, "/kyc/admin/stats", {
      method: "GET",
    });
  },
};

export default kycService;
