// "use server"

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  UserData,
  AuthResponse,
  UpdateDistributorStoreProfileData,
  UpdateUserData,
  UploadProfilePhotoRequest,
} from "@/types/user";
import { LoginFormData as LoginData } from "@/app/(auth)/login/login.schema";
import { RegisterFormData as RegisterData } from "@/app/(auth)/register/register.schema";
import authService from "@/services/authService";
import { UpdatePasswordData } from "@/app/dashboard/distributor/profile/schemas/password.schema";

export interface ExtendedAuthResponse extends AuthResponse {
  isError: boolean;
  isSuccess: boolean;
  isLoading: boolean;
  lastCompletedAction: AuthActionType;
}

export type AuthActionType =
  | "register"
  | "verifyEmail"
  | "resendVerificationEmail"
  | "login"
  | "updateUser"
  | "updateDistributorStoreProfile"
  | "updatePassword"
  | "uploadDisplayPhoto"
  | null;

// Create initial state (user will be set via async initialization)
export const initialAuthState: ExtendedAuthResponse = {
  data: null,
  message: "",
  success: false,
  isError: false,
  isLoading: false,
  isSuccess: false,
  lastCompletedAction: null,
};

const isAuthUserData = (value: unknown): value is UserData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<UserData>;
  return typeof user.email === "string" && typeof user.role === "string";
};

const mergeUserData = (
  currentUser: UserData | null,
  nextUser: UserData | null
): UserData | null => {
  if (!nextUser) {
    return null;
  }

  if (nextUser.tokens?.accessToken || !currentUser?.tokens) {
    return nextUser;
  }

  return {
    ...nextUser,
    tokens: currentUser.tokens,
  };
};

// Register user
export const register = createAsyncThunk(
  "auth/register",
  async (userData: RegisterData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  }
);

// Verify user email
export const verifyEmail = createAsyncThunk(
  "auth/verify-email",
  async (
    { verificationCode, user }: { verificationCode: number; user: UserData },
    thunkAPI
  ) => {
    try {
      return await authService.verifyEmail(verificationCode, user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email verification failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createNewPassword = createAsyncThunk(
  "auth/create-new-password",
  async (userData: {newPassword: string; resetGrant?: string}, thunkAPI) => {
    try {

      // Pass your parameters here as needed
      return await authService.createNewPassword(userData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Create new password failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Resend verification mail
export const resendVerificationEmail = createAsyncThunk(
  "auth/resend-email",
  async (pendingRegistrationId: string, thunkAPI) => {
    try {
      return await authService.resendVerificationEmail(pendingRegistrationId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Resend email failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  "auth/login",
  async (userData: LoginData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "auth/update-user",
  async (
    { token, formData }: { token: string; formData: UpdateUserData },
    thunkAPI
  ) => {
    try {
      return await authService.updateUser(token, formData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  await authService.logout();
});

// Update password
export const updatePassword = createAsyncThunk(
  "auth/update-password",
  async (
    { token, formData }: { token: string; formData: UpdatePasswordData },
    thunkAPI
  ) => {
    try {
      return await authService.updatePassword(token, formData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update password failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);


// Upload display photo
export const uploadDisplayPhoto = createAsyncThunk(
  "auth/upload-display-photo",
  async ({ token, fileData }: { token: string; fileData: UploadProfilePhotoRequest }, thunkAPI) => {
    try {
      return await authService.uploadDisplayPhoto(token, fileData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateDistributorStoreProfile = createAsyncThunk(
  "auth/update-distributor-store-profile",
  async (
    {
      token,
      formData,
    }: { token: string; formData: UpdateDistributorStoreProfileData },
    thunkAPI,
  ) => {
    try {
      return await authService.updateDistributorStoreProfile(token, formData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Update distributor store profile failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Create auth slice
export const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
      state.lastCompletedAction = null;
    },
    setUser: (state, action: PayloadAction<UserData | null>) => {
      state.data = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.data = isAuthUserData(action.payload.data)
          ? action.payload.data
          : null;
        state.message = action.payload.message;
        state.lastCompletedAction = "register";
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.data = null;
        state.lastCompletedAction = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.data = isAuthUserData(action.payload.data)
          ? mergeUserData(state.data, action.payload.data)
          : state.data;
        state.message = action.payload.message;
        state.lastCompletedAction = "login";
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.data = null;
        state.lastCompletedAction = null;
      })
      .addCase(resendVerificationEmail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Verification code sent to Email";
        state.lastCompletedAction = "resendVerificationEmail";
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.lastCompletedAction = null;
      })
      // Profile Photo Upload
      .addCase(uploadDisplayPhoto.pending, (state) => {
        state.isLoading = true; 
        state.isError = false;
      })
      .addCase(uploadDisplayPhoto.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.data = mergeUserData(state.data, action.payload.data);
        state.message = action.payload.message;
        state.lastCompletedAction = "uploadDisplayPhoto";
      })
      .addCase(uploadDisplayPhoto.rejected, (state, action) => {
        state.isLoading = false; 
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.lastCompletedAction = "uploadDisplayPhoto";
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.data = mergeUserData(state.data, action.payload.data);
        state.message = action.payload.message;
        state.lastCompletedAction = "updateUser";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.lastCompletedAction = "updateUser";
      })
      // Update Distributor Store Profile
      .addCase(updateDistributorStoreProfile.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(updateDistributorStoreProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.data = mergeUserData(state.data, action.payload.data);
        state.message = action.payload.message;
        state.lastCompletedAction = "updateDistributorStoreProfile";
      })
      .addCase(updateDistributorStoreProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.lastCompletedAction = "updateDistributorStoreProfile";
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.data = isAuthUserData(action.payload.data)
          ? action.payload.data
          : state.data;
        state.message = action.payload.message;
        state.lastCompletedAction = "verifyEmail";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.lastCompletedAction = null;
      })
      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.isError = false;
        state.message = action.payload.message;
        state.lastCompletedAction = "updatePassword";
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
        state.lastCompletedAction = "updatePassword";
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.data = null;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
        state.lastCompletedAction = null;
      });
  },
});

export const { reset, setUser } = authSlice.actions;
export default authSlice.reducer;
