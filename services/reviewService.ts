import { DisplayPhoto } from "@/types/user";
import { apiUrl } from "@/utils/api-base-url";

export interface ReviewBuyer {
  _id: string;
  firstName?: string;
  lastName?: string;
  displayPhoto?: DisplayPhoto;
}

export interface ReviewServiceRequestSummary {
  _id?: string;
  jobType?: string;
  equipmentName?: string;
}

export interface ReviewData {
  _id: string;
  serviceRequest: string | ReviewServiceRequestSummary;
  engineer: string;
  buyer: string | ReviewBuyer;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface CreateReviewPayload {
  serviceRequestId: string;
  rating: number;
  comment?: string;
}

interface ReviewResponse {
  success: boolean;
  message: string;
  data: ReviewData;
}

interface ReviewCheckResponse {
  success: boolean;
  message: string;
  data?: ReviewData;
}

interface ReviewListResponse {
  success: boolean;
  message: string;
  data: ReviewData[];
}

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

export const reviewService = {
  async createReview(
    token: string,
    payload: CreateReviewPayload
  ): Promise<ReviewResponse> {
    const response = await fetch(apiUrl("/reviews"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Failed to submit review")
      );
    }

    return response.json();
  },

  async getReviewForServiceRequest(
    token: string,
    serviceRequestId: string
  ): Promise<ReviewData | null> {
    const response = await fetch(
      apiUrl(`/reviews/service-request/${serviceRequestId}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Failed to check review status")
      );
    }

    const result: ReviewCheckResponse = await response.json();
    return result.data ?? null;
  },

  async getEngineerReviews(engineerId: string): Promise<ReviewData[]> {
    const response = await fetch(apiUrl(`/reviews/engineer/${engineerId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Failed to fetch engineer reviews")
      );
    }

    const result: ReviewListResponse = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  },
};
