"use client";

/**
 * KYC API client. Mirrors `baiy-server/src/routes/kycRouter.ts`
 * (commit `0558e4a feat: add kyc`).
 *
 * Two things changed shape versus the previous frontend implementation:
 *
 * 1. Submissions are **multipart/form-data in a single request**. There is no
 *    separate `/kyc/upload` endpoint — the server uploads to Cloudinary itself
 *    inside `POST /kyc/submissions`. Each file is appended under the document's
 *    `fieldName`, and text fields are appended flat alongside `tierKey`.
 *
 * 2. Admin approval/rejection is **per tier, not per submission**:
 *    `PATCH /kyc/admin/tiers/:tierKey/approve|reject`.
 */

import { apiUrl } from "@/utils/api-base-url";
import type {
  AdminKycListRow,
  AdminKycStats,
  AdminKycSubmissionDetail,
  AdminKycTierDefinition,
  KycApiEnvelope,
  KycPaginatedEnvelope,
  KycSubmission,
  KycTierDefinition,
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
  const requestUrl =
    path.startsWith("http://") || path.startsWith("https://") ? path : apiUrl(path);

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

/** A file staged for upload against a tier's required document field. */
export interface KycDocumentUpload {
  /** Must match a `requiredDocuments[].fieldName` on the tier. */
  fieldName: string;
  file: File;
}

export interface CreateKycSubmissionPayload {
  tierKey: string;
  /** Keyed by `requiredTextFields[].fieldName`. */
  textFields?: Record<string, string>;
  /**
   * Repeat the same `fieldName` to send multiple files for one requirement
   * (e.g. `factory_images`). Server caps the request at 10 files, 5MB each.
   */
  documents?: KycDocumentUpload[];
}

export type KycStatusFilter = "all" | "pending" | "approved" | "rejected";
export type KycRoleFilter = "all" | "buyer" | "distributor" | "oem" | "engineer";

export interface MyKycFilters {
  status?: KycStatusFilter;
  /** Matches either `tierKey` or `tierLabel` server-side. */
  kycLevel?: string;
}

export interface AdminKycFilters extends MyKycFilters {
  userCategory?: KycRoleFilter;
  /** ISO date string. */
  date?: string;
  page?: number;
  limit?: number;
}

export interface AdminKycTierFilters {
  role?: KycRoleFilter;
  submissionBehavior?: "all" | "none" | "review_required" | "admin_only";
}

const buildUrl = (path: string, params: Record<string, unknown>) => {
  const url = new URL(apiUrl(path));

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

/**
 * Builds the multipart body the server expects. Content-Type is deliberately
 * left unset so the browser emits the correct multipart boundary.
 */
const toSubmissionFormData = (payload: CreateKycSubmissionPayload): FormData => {
  const formData = new FormData();
  formData.append("tierKey", payload.tierKey);

  Object.entries(payload.textFields ?? {}).forEach(([fieldName, value]) => {
    if (value === undefined || value === null) return;
    formData.append(fieldName, String(value));
  });

  (payload.documents ?? []).forEach(({ fieldName, file }) => {
    formData.append(fieldName, file, file.name);
  });

  return formData;
};

const kycService = {
  /* ---------------------------------------------------------------- */
  /* Submitter (buyer / distributor / oem / engineer)                  */
  /* ---------------------------------------------------------------- */

  /** Tier catalogue for the authenticated user's role. */
  async getTiers(token: string) {
    return requestJson<KycTierDefinition[]>(token, "/kyc/tiers", {
      method: "GET",
    });
  },

  async getSubmissions(token: string, filters: MyKycFilters = {}) {
    return requestJson<KycSubmission[]>(
      token,
      buildUrl("/kyc/submissions", {
        status: filters.status,
        kycLevel: filters.kycLevel,
      }),
      { method: "GET" },
    );
  },

  async getSubmission(token: string, id: string) {
    return requestJson<KycSubmission>(token, `/kyc/submissions/${id}`, {
      method: "GET",
    });
  },

  /**
   * Creates a submission and uploads its documents in one multipart request.
   *
   * Server-side rejections to surface in the UI:
   *  - prerequisite tier not yet approved
   *  - an active submission already exists for this tier
   *  - a required text field or document is missing
   */
  async createSubmission(token: string, payload: CreateKycSubmissionPayload) {
    return requestJson<KycSubmission>(token, "/kyc/submissions", {
      method: "POST",
      body: toSubmissionFormData(payload),
    });
  },

  /* ---------------------------------------------------------------- */
  /* Admin                                                             */
  /* ---------------------------------------------------------------- */

  async getAdminSubmissions(token: string, filters: AdminKycFilters = {}) {
    return requestJson<AdminKycListRow[] | KycPaginatedEnvelope<AdminKycListRow>>(
      token,
      buildUrl("/kyc/admin/submissions", {
        status: filters.status,
        kycLevel: filters.kycLevel,
        userCategory: filters.userCategory,
        date: filters.date,
        page: filters.page,
        limit: filters.limit,
      }),
      { method: "GET" },
    );
  },

  async getAdminSubmission(token: string, id: string) {
    return requestJson<AdminKycSubmissionDetail>(
      token,
      `/kyc/admin/submissions/${id}`,
      { method: "GET" },
    );
  },

  /** Moves a submission from `submitted` to `under_review`. */
  async markSubmissionUnderReview(token: string, id: string) {
    return requestJson<AdminKycSubmissionDetail>(
      token,
      `/kyc/admin/submissions/${id}/under-review`,
      { method: "PATCH" },
    );
  },

  /** Full tier catalogue across all roles, for admin tooling. */
  async getAdminTiers(token: string, filters: AdminKycTierFilters = {}) {
    return requestJson<AdminKycTierDefinition[]>(
      token,
      buildUrl("/kyc/admin/tiers", {
        role: filters.role,
        submissionBehavior: filters.submissionBehavior,
      }),
      { method: "GET" },
    );
  },

  /**
   * Approves a tier for a user. Pass `submissionId` to approve a pending
   * review-required submission; pass `userId` to grant an `admin_only` tier
   * (Premium) directly, where no submission exists.
   */
  async approveTier(
    token: string,
    tierKey: string,
    payload: { submissionId?: string; userId?: string },
  ) {
    return requestJson<AdminKycSubmissionDetail>(
      token,
      `/kyc/admin/tiers/${tierKey}/approve`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  },

  async rejectTier(
    token: string,
    tierKey: string,
    payload: { submissionId: string; rejectionReason: string },
  ) {
    return requestJson<AdminKycSubmissionDetail>(
      token,
      `/kyc/admin/tiers/${tierKey}/reject`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
