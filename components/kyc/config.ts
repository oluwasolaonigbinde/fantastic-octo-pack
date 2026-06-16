import { UserRole, type UserData } from "@/types/user";

export const KYC_ROLE_PATHS: Record<
  UserRole.BUYER | UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER,
  string
> = {
  [UserRole.BUYER]: "/dashboard/buyer/kyc-verification",
  [UserRole.DISTRIBUTOR]: "/dashboard/distributor/kyc-verification",
  [UserRole.OEM]: "/dashboard/oem/kyc-verification",
  [UserRole.ENGINEER]: "/dashboard/engineer/kyc-verification",
};

export const KYC_ROLE_DESCRIPTIONS: Record<
  UserRole.BUYER | UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER,
  string
> = {
  [UserRole.BUYER]: "Verify and upgrade your kyc status.",
  [UserRole.DISTRIBUTOR]: "Verify and upgrade your KYC status",
  [UserRole.OEM]: "Verify and upgrade your kyc status",
  [UserRole.ENGINEER]:
    "Complete identity and professional verification to unlock full platform access",
};

export const KYC_ROLE_INTRO_COPY: Record<
  UserRole.BUYER | UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER,
  string
> = {
  [UserRole.BUYER]:
    "The higher your account tiers, the higher your privileges/benefit as a buyer.",
  [UserRole.DISTRIBUTOR]:
    "The higher your account tiers, the higher your privileges/benefit as distributor.",
  [UserRole.OEM]:
    "The higher your account tiers, the higher your privileges/benefit as an OEM.",
  [UserRole.ENGINEER]:
    "The higher your account tiers, the higher your privileges/benefit as service engineer.",
};

export const KYC_UPLOAD_ACCEPT =
  ".doc,.docx,.pdf,.jpg,.jpeg,.png,.webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/jpeg,image/png,image/webp";

export const KYC_UPLOAD_FORMAT_LABEL = "DOC, DOCX, PDF, JPG/JPEG, PNG, WEBP";

export interface ReadOnlyField {
  label: string;
  value: string;
}

export const buildBaseReadOnlyFields = (
  role: UserRole.BUYER | UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER,
  user: UserData | null,
): ReadOnlyField[] => {
  const shared = [
    { label: "First name", value: user?.firstName || "-" },
    { label: "Last name", value: user?.lastName || "-" },
    { label: "Email address", value: user?.email || "-" },
    { label: "Phone number", value: user?.phoneNumber || "-" },
  ];

  if (role === UserRole.OEM) {
    return [
      ...shared,
      { label: "Claimed company name", value: user?.lastName || user?.firstName || "-" },
    ];
  }

  return shared;
};
