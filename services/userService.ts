import {
  PublicProfileData,
  PublicProfileDetailResponse,
  PublicProfileResponse,
  UserResponse,
  UserRole,
} from "@/types/user";
import { apiUrl } from "@/utils/api-base-url";

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

export const userService = {
  async getUsers(
    token: string,
    page: number = 1,
    limit: number = 20,
    role?: UserRole
  ): Promise<UserResponse> {
    const url = new URL(apiUrl("/users"));
    url.searchParams.append("page", String(page));
    url.searchParams.append("limit", String(limit));

    if (role) {
      url.searchParams.append("role", role);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Failed to fetch users"));
    }

    return response.json();
  },

  async getPublicProfiles(
    page: number = 1,
    limit: number = 50,
    roles: Array<UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER> = [
      UserRole.DISTRIBUTOR,
      UserRole.OEM,
    ],
    search?: string,
    filters?: {
      minRating?: number;
      specialization?: string;
      equipmentType?: string;
      location?: string;
      availability?: "available" | "busy";
      sortBy?: "name-asc" | "name-desc";
    },
    includeFacets?: boolean,
  ): Promise<PublicProfileResponse> {
    const url = new URL(apiUrl("/public/profiles"));
    url.searchParams.append("page", String(page));
    url.searchParams.append("limit", String(limit));
    url.searchParams.append("roles", roles.join(","));

    if (search?.trim()) {
      url.searchParams.append("search", search.trim());
    }

    if (filters?.minRating) {
      url.searchParams.append("minRating", String(filters.minRating));
    }
    if (filters?.specialization) {
      url.searchParams.append("specialization", filters.specialization);
    }
    if (filters?.equipmentType) {
      url.searchParams.append("equipmentType", filters.equipmentType);
    }
    if (filters?.location) {
      url.searchParams.append("location", filters.location);
    }
    if (filters?.availability) {
      url.searchParams.append("availability", filters.availability);
    }
    if (filters?.sortBy) {
      url.searchParams.append("sortBy", filters.sortBy);
    }
    if (includeFacets) {
      url.searchParams.append("includeFacets", "true");
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Failed to fetch public profiles")
      );
    }

    return response.json();
  },

  async getPublicProfileById(id: string): Promise<PublicProfileData> {
    const response = await fetch(apiUrl(`/public/profiles/${id}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Public profile not found")
      );
    }

    const result: PublicProfileDetailResponse = await response.json();
    return result.data;
  },
};
