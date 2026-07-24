export type AuthFlowStep =
  | "verify_email"
  | "complete_signup"
  | "select_role"
  | "create_password"
  | "login";

export type PendingAuthIntentAction =
  | "send_inquiry"
  | "order_now"
  | "request_service"
  | "send_message"
  | "request_quote";

export interface PendingServiceRequestDraft {
  jobType: string;
  equipmentName: string;
  model: string;
  serviceLocation?: string;
  preferredDate: string;
  preferredTime: string;
  serviceDescription: string;
}

export type RegistrationRole =
  | "buyer"
  | "distributor"
  | "oem"
  | "engineer";

export type PendingRegistrationStatus =
  | "pending_registration"
  | "account_exists"
  | "onboarding_incomplete"
  | "account_created"
  | "already_completed"
  | "expired";

export type PendingRegistrationSource = "manual" | "google" | "apple";

export interface PendingRegistrationSummary {
  pendingRegistrationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  source: PendingRegistrationSource;
  isEmailVerified: boolean;
  role?: RegistrationRole;
  currentStep?: AuthFlowStep | "completed";
}

export interface PendingRegistrationContext
  extends PendingRegistrationSummary {
  status: PendingRegistrationStatus;
  nextStep: AuthFlowStep;
  acceptTerms: boolean;
  verificationCode?: number;
}

export interface PendingSendMessageIntent {
  action: "send_message";
  receiverId: string;
  sourcePath?: string;
}

export interface PendingProductIntent {
  sourcePath: string;
  action: "send_inquiry" | "order_now";
  productId: string;
  productName?: string;
  sellerId?: string;
}

export interface PendingServiceRequestIntent {
  sourcePath: string;
  action: "request_service";
  engineerId?: string;
  serviceRequestDraft?: PendingServiceRequestDraft;
}

/**
 * A buyer asked a named distributor for a quote before signing in. Resumed as a
 * direct-routed RFQ (`routingMode: "direct"`) addressed to that distributor
 * alone, rather than going through the marketplace routing engine.
 */
export interface PendingRequestQuoteIntent {
  sourcePath: string;
  action: "request_quote";
  distributorId: string;
  distributorName?: string;
}

export type PendingAuthIntent =
  | PendingSendMessageIntent
  | PendingProductIntent
  | PendingServiceRequestIntent
  | PendingRequestQuoteIntent;

export interface PendingResetContext {
  email: string;
  verificationCode?: number;
  resetGrant?: string;
}

export interface PublicAuthEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PublicAuthErrorDetails {
  status?: PendingRegistrationStatus;
  nextStep?: AuthFlowStep | "register";
  pendingRegistration?: PendingRegistrationSummary;
  email?: string;
  [key: string]: unknown;
}
