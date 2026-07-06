import {
  AuthResponse,
  UpdateDistributorStoreProfileData,
  UpdateUserData,
  UploadProfilePhotoRequest,
  UserData,
} from "@/types/user";
import {
  AuthFlowStep,
  PendingRegistrationContext,
  PendingRegistrationSummary,
  PublicAuthEnvelope,
  PublicAuthErrorDetails,
} from "@/types/auth";
import { LoginFormData as LoginData } from "@/app/(auth)/login/login.schema";
import { RegisterFormData as RegisterData } from "@/app/(auth)/register/register.schema";
import { UpdatePasswordData } from "@/app/dashboard/distributor/profile/schemas/password.schema";
import { apiUrl } from "@/utils/api-base-url";
import {
  broadcastLogout,
  clearAuthSessionUser,
  readAuthSessionUser,
  writeAuthSessionUser,
} from "@/utils/authSession";
import { clearLocalRoleAuthState } from "@/utils/localRoleAuth";
import { clearAuthRoleCookie } from "@/utils/authRoleCookie";

export class AuthApiError extends Error {
  public readonly statusCode: number;
  public readonly details: PublicAuthErrorDetails | null;

  constructor(
    message: string,
    statusCode: number,
    details: PublicAuthErrorDetails | null = null,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface StartRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  acceptTerms: boolean;
  googleIdToken?: string;
}

export interface SelectRolePayload {
  pendingRegistrationId: string;
  role: "buyer" | "distributor" | "oem" | "engineer";
}

export interface VerifyRegistrationEmailPayload {
  pendingRegistrationId: string;
  verificationCode: number;
}

export interface CreateAccountPayload {
  pendingRegistrationId: string;
  password: string;
  role?: "buyer" | "distributor" | "oem" | "engineer";
}

export interface VerifyResetOtpPayload {
  email: string;
  verificationCode: number;
}

export interface SocialAuthPayload {
  provider: "google" | "apple";
  idToken: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface CompleteSocialSignupPayload {
  pendingRegistrationId: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
}

export interface ResetPasswordWithGrantPayload {
  resetGrant: string;
  newPassword: string;
}

type RegistrationResponseData = {
  status: string;
  nextStep: AuthFlowStep;
  pendingRegistration?: PendingRegistrationSummary;
  verificationCode?: number;
  email?: string;
};

type VerifyResetOtpResponseData = {
  resetGrant: string;
  expiresInMinutes: number;
};

const parseJsonResponse = async <T>(
  response: Response,
): Promise<PublicAuthEnvelope<T> | null> => {
  try {
    return (await response.json()) as PublicAuthEnvelope<T>;
  } catch {
    return null;
  }
};

const parseErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<never> => {
  const errorPayload = await parseJsonResponse<PublicAuthErrorDetails>(response);
  throw new AuthApiError(
    errorPayload?.message || fallback,
    response.status,
    (errorPayload?.data as PublicAuthErrorDetails | undefined) ||
      ((errorPayload as unknown as { error?: PublicAuthErrorDetails })?.error ??
        null),
  );
};

const toPendingRegistrationContext = (
  payload: RegistrationResponseData,
  fallbackValues?: Pick<
    PendingRegistrationContext,
    "firstName" | "lastName" | "phoneNumber" | "acceptTerms"
  >,
): PendingRegistrationContext | null => {
  if (!payload.pendingRegistration) {
    return null;
  }

  return {
    ...payload.pendingRegistration,
    status:
      payload.status === "onboarding_incomplete"
        ? "onboarding_incomplete"
        : "pending_registration",
    nextStep: payload.nextStep,
    acceptTerms: fallbackValues?.acceptTerms ?? true,
    firstName:
      payload.pendingRegistration.firstName || fallbackValues?.firstName || "",
    lastName:
      payload.pendingRegistration.lastName || fallbackValues?.lastName || "",
    phoneNumber:
      payload.pendingRegistration.phoneNumber || fallbackValues?.phoneNumber || "",
    verificationCode: payload.verificationCode,
  };
};

const requestJson = async <TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  fallbackMessage: string,
): Promise<PublicAuthEnvelope<TResponse>> => {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return parseErrorMessage(response, fallbackMessage);
  }

  const payload = await parseJsonResponse<TResponse>(response);

  if (!payload) {
    throw new AuthApiError(fallbackMessage, response.status, null);
  }

  return payload;
};

const startRegistration = async (
  payload: StartRegistrationPayload,
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  requestJson<RegistrationResponseData, StartRegistrationPayload>(
    "/auth/register",
    payload,
    "Unable to start signup",
  );

const resumeRegistration = async (
  pendingRegistration: PendingRegistrationContext,
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  requestJson<RegistrationResponseData, StartRegistrationPayload>(
    "/auth/register",
    {
      firstName: pendingRegistration.firstName || "",
      lastName: pendingRegistration.lastName || "",
      email: pendingRegistration.email,
      phoneNumber: pendingRegistration.phoneNumber || "",
      acceptTerms: pendingRegistration.acceptTerms,
    },
    "Unable to resume signup",
  );

const selectRegistrationRole = async (
  payload: SelectRolePayload,
): Promise<PublicAuthEnvelope<UserData | RegistrationResponseData>> =>
  requestJson<UserData | RegistrationResponseData, SelectRolePayload>(
    "/auth/register",
    payload,
    "Unable to save role selection",
  );

const register = async (
  payload: RegisterData,
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  startRegistration(payload);

const verifyRegistrationEmail = async (
  payload: VerifyRegistrationEmailPayload,
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  requestJson<RegistrationResponseData, VerifyRegistrationEmailPayload>(
    "/auth/verify-email",
    payload,
    "Email verification failed",
  );

const verifyEmail = async (
  verificationCode: number,
  user: UserData & { pendingRegistrationId?: string },
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  verifyRegistrationEmail({
    pendingRegistrationId: user.pendingRegistrationId || "",
    verificationCode,
  });

const resendRegistrationOtp = async (
  pendingRegistrationId: string,
): Promise<PublicAuthEnvelope<{ verificationCode?: number }>> =>
  requestJson<{ verificationCode?: number }, { pendingRegistrationId: string }>(
    "/auth/resend-verification-email",
    { pendingRegistrationId },
    "Unable to resend verification email",
  );

const resendVerificationEmail = async (
  pendingRegistrationId: string,
): Promise<PublicAuthEnvelope<{ verificationCode?: number }>> =>
  resendRegistrationOtp(pendingRegistrationId);

const createAccount = async (
  payload: CreateAccountPayload,
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  requestJson<RegistrationResponseData, CreateAccountPayload>(
    "/auth/create-account",
    payload,
    "Unable to create account",
  );

const socialAuth = async (
  payload: SocialAuthPayload,
): Promise<PublicAuthEnvelope<UserData | RegistrationResponseData>> =>
  requestJson<UserData | RegistrationResponseData, SocialAuthPayload>(
    "/auth/social-auth",
    payload,
    "Unable to continue with social sign in",
  );

const completeSocialSignup = async (
  payload: CompleteSocialSignupPayload,
): Promise<PublicAuthEnvelope<RegistrationResponseData>> =>
  requestJson<RegistrationResponseData, CompleteSocialSignupPayload>(
    "/auth/complete-social-signup",
    payload,
    "Unable to save your signup details",
  );

const forgotPassword = async (
  email: string,
): Promise<PublicAuthEnvelope<{ verificationCode?: number }>> =>
  requestJson<{ verificationCode?: number }, { email: string }>(
    "/auth/forgot-password",
    { email },
    "Unable to start password reset",
  );

const verifyOtp = async (
  payload: VerifyResetOtpPayload,
): Promise<PublicAuthEnvelope<VerifyResetOtpResponseData>> =>
  requestJson<VerifyResetOtpResponseData, VerifyResetOtpPayload>(
    "/auth/verify-otp",
    payload,
    "OTP verification failed",
  );

const resetPasswordWithGrant = async (
  payload: ResetPasswordWithGrantPayload,
): Promise<PublicAuthEnvelope<null>> =>
  requestJson<null, ResetPasswordWithGrantPayload>(
    "/auth/reset-password",
    payload,
    "Password reset failed",
  );

const login = async (
  formData: LoginData,
): Promise<PublicAuthEnvelope<UserData | RegistrationResponseData>> => {
  const response = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    return parseErrorMessage(response, "Login failed");
  }

  const result = await parseJsonResponse<UserData | RegistrationResponseData>(
    response,
  );

  if (!result) {
    throw new AuthApiError("Login failed", response.status, null);
  }

  const authUser = result.data as UserData | null;

  if (authUser?.tokens?.accessToken) {
    writeAuthSessionUser(authUser);
  }

  return result;
};

const updateUser = async (
  token: string,
  userData: UpdateUserData,
): Promise<AuthResponse> => {
  const response = await fetch(apiUrl("/auth/profile"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    return parseErrorMessage(response, "Update failed");
  }

  return response.json();
};

const updatePassword = async (
  token: string,
  formData: UpdatePasswordData,
): Promise<AuthResponse> => {
  const response = await fetch(apiUrl("/auth/change-password"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    return parseErrorMessage(response, "Update password failed");
  }

  return response.json();
};

const logout = async (): Promise<void> => {
  const currentUser = readAuthSessionUser();

  try {
    try {
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        headers: currentUser?.tokens?.accessToken
          ? {
              Authorization: `Bearer ${currentUser.tokens.accessToken}`,
            }
          : undefined,
        credentials: "include",
      });
    } catch {
      // Clearing the local session state is still the correct fallback if the
      // server cannot be reached during logout.
    }
  } finally {
    clearAuthSessionUser();
    clearLocalRoleAuthState();
    clearAuthRoleCookie();
    broadcastLogout();
  }
};

const getCurrentUser = async (token: string): Promise<UserData> => {
  const response = await fetch(apiUrl("/auth/profile"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return parseErrorMessage(response, "Unable to hydrate your profile");
  }

  const result = (await response.json()) as AuthResponse;

  if (!result?.data) {
    throw new AuthApiError("Unable to hydrate your profile", response.status, null);
  }

  return result.data;
};

const uploadDisplayPhoto = async (
  token: string,
  fileData: UploadProfilePhotoRequest,
): Promise<AuthResponse> => {
  const { file } = fileData;
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(apiUrl("/auth/display-photo"), {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    return parseErrorMessage(response, "Upload failed");
  }

  return response.json();
};

const updateDistributorStoreProfile = async (
  token: string,
  formData: UpdateDistributorStoreProfileData,
): Promise<AuthResponse> => {
  const body = new FormData();

  const appendString = (key: string, value?: string) => {
    body.append(key, value?.trim() ?? "");
  };

  appendString("businessName", formData.businessName);
  appendString("about", formData.about);
  appendString("dateFounded", formData.dateFounded);
  appendString("city", formData.city);
  appendString("state", formData.state);
  appendString("country", formData.country);
  appendString("address", formData.address);
  body.append("countriesCovered", JSON.stringify(formData.countriesCovered ?? []));
  body.append("categories", JSON.stringify(formData.categories ?? []));
  body.append("certifications", JSON.stringify(formData.certifications ?? []));
  body.append("certificationNames", JSON.stringify(formData.certificationNames ?? []));

  if (formData.storeLogo) {
    body.append("storeLogo", formData.storeLogo);
  }

  if (formData.coverPhoto) {
    body.append("coverPhoto", formData.coverPhoto);
  }

  formData.certificationFiles?.forEach((file) => {
    body.append("certifications", file);
  });

  const response = await fetch(apiUrl("/auth/profile/distributor-store"), {
    method: "PATCH",
    body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    return parseErrorMessage(response, "Update distributor store profile failed");
  }

  return response.json();
};

const createNewPassword = async (payload: {
  resetGrant?: string;
  newPassword: string;
}): Promise<PublicAuthEnvelope<null>> => {
  if (!payload.resetGrant) {
    throw new AuthApiError(
      "Reset grant is required to reset the password.",
      400,
      null,
    );
  }

  return resetPasswordWithGrant({
    resetGrant: payload.resetGrant,
    newPassword: payload.newPassword,
  });
};

const authService = {
  AuthApiError,
  startRegistration,
  resumeRegistration,
  selectRegistrationRole,
  register,
  verifyRegistrationEmail,
  verifyEmail,
  resendRegistrationOtp,
  resendVerificationEmail,
  createAccount,
  socialAuth,
  completeSocialSignup,
  forgotPassword,
  verifyOtp,
  resetPasswordWithGrant,
  createNewPassword,
  login,
  logout,
  updateUser,
  updateDistributorStoreProfile,
  updatePassword,
  getCurrentUser,
  uploadDisplayPhoto,
  toPendingRegistrationContext,
};

export default authService;
