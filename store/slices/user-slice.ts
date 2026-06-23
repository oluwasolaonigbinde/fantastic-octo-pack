import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userService } from "@/services/userService";
import {
  PublicProfileData,
  PublicProfileFacets,
  PublicProfilePaginationData,
  PublicProfileResponse,
  UserRole,
} from "@/types/user";

export interface PublicProfileFilters {
  minRating?: number;
  specialization?: string;
  equipmentType?: string;
  location?: string;
  availability?: "available" | "busy";
  sortBy?: "name-asc" | "name-desc";
}

export const fetchPublicProfiles = createAsyncThunk<
  PublicProfileResponse,
  {
    page?: number;
    limit?: number;
    roles?: Array<UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER>;
    search?: string;
    filters?: PublicProfileFilters;
    includeFacets?: boolean;
  }
>(
  "users/fetchPublicProfiles",
  async ({
    page = 1,
    limit = 50,
    roles = [UserRole.DISTRIBUTOR, UserRole.OEM],
    search,
    filters,
    includeFacets,
  }) => {
    return userService.getPublicProfiles(
      page,
      limit,
      roles,
      search,
      filters,
      includeFacets,
    );
  },
);

export const fetchPublicProfileById = createAsyncThunk<
  PublicProfileData,
  string
>("users/fetchPublicProfileById", async (id) =>
  userService.getPublicProfileById(id),
);

export const getUsersThunk = fetchPublicProfiles;
export const fetchUserById = fetchPublicProfileById;

interface UserState {
  userData: PublicProfilePaginationData | null;
  users: PublicProfileData[];
  pagination: {
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  facets: PublicProfileFacets | null;
  selectedUser: PublicProfileData | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  userData: null,
  users: [],
  pagination: null,
  facets: null,
  selectedUser: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUserState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload.data;
        state.users = action.payload.data.docs;
        state.pagination = {
          totalDocs: action.payload.data.totalDocs,
          limit: action.payload.data.limit,
          totalPages: action.payload.data.totalPages,
          page: action.payload.data.page,
          hasNextPage: action.payload.data.hasNextPage,
          hasPreviousPage: action.payload.data.hasPreviousPage,
        };
        state.facets = action.payload.data.facets ?? null;
      })
      .addCase(fetchPublicProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch public profiles";
      })
      .addCase(fetchPublicProfileById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicProfileById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchPublicProfileById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch public profile";
      });
  },
});

export const { resetUserState } = userSlice.actions;

export default userSlice.reducer;
