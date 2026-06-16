export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  /** Engineer-only fields (stripped server-side for non-engineers) */
  bio?: string;
  specializations?: string[];
  equipmentTypes?: string[];
  oemTags?: string[];
  experienceYears?: number;
  engineerAvailability?: "available" | "busy";
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DisplayPhoto {
  url: string;
  cloudinary_id: string;
}

export interface DistributorStoreAsset {
  url: string;
  cloudinary_id: string;
  originalName?: string;
}

export interface DistributorStoreCertification {
  name: string;
  url: string;
  cloudinary_id: string;
  originalName: string;
}

export interface DistributorStoreProfile {
  businessName?: string;
  about?: string;
  countriesCovered?: string[];
  dateFounded?: string;
  categories?: string[];
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  storeLogo?: DistributorStoreAsset;
  coverPhoto?: DistributorStoreAsset;
  certifications?: DistributorStoreCertification[];
}

export interface UpdateDistributorStoreProfileData {
  businessName?: string;
  about?: string;
  countriesCovered?: string[];
  dateFounded?: string;
  categories?: string[];
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  certifications?: DistributorStoreCertification[];
  certificationNames?: string[];
  storeLogo?: File | null;
  coverPhoto?: File | null;
  certificationFiles?: File[];
}

export enum UserRole {
  BUYER = "buyer",
  DISTRIBUTOR = "distributor",
  OEM = "oem",
  ENGINEER = "engineer",
  ADMIN = "admin",
  AGENT = "agent",
  SUPER_ADMIN = "super_admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  email: string;
  displayPhoto?: DisplayPhoto;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  dateOfBirth?: Date | string | null;
  distributorStoreProfile?: DistributorStoreProfile;
  createdAt: Date | string;
  updatedAt: Date | string;
  tokens?: SessionTokens;
  verificationCode?: number;
  /** Engineer profile fields */
  bio?: string;
  specializations?: string[];
  equipmentTypes?: string[];
  oemTags?: string[];
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  oemCertified?: boolean;
  engineerAvailability?: "available" | "busy";
  kycBadgeLabel?: string;
  engineerTierLabel?: string;
}

export interface UserWithVerification extends UserData {
  verificationCode: number;
}

export interface UserLoginResponse {
  success: boolean;
  message: string;
  data: UserData | null;
}

export interface UserRegistrationResponse {
  success: boolean;
  message: string;
  data: UserWithVerification | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: UserData | null;
}

export interface UserPaginationData {
  docs: UserData[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: UserPaginationData;
}

export interface PublicProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  displayPhoto?: DisplayPhoto;
  role: UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER;
  specializations?: string[];
  equipmentTypes?: string[];
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  bio?: string;
  /** OEM brand tags (e.g. ["Caterpillar", "Cummins"]) */
  oemTags?: string[];
  /** Figma buyer directory — green "Verified" / OEM certified */
  oemCertified?: boolean;
  /** Figma — AVAILABLE (green) vs BUSY (orange) */
  engineerAvailability?: "available" | "busy";
  distributorStoreProfile?: DistributorStoreProfile;
}

export interface PublicProfileFacetItem {
  value: string;
  filteredCount: number;
}

export interface PublicProfileFacets {
  locations: PublicProfileFacetItem[];
  specializations: PublicProfileFacetItem[];
  equipmentTypes: PublicProfileFacetItem[];
}

export interface PublicProfilePaginationData {
  docs: PublicProfileData[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  facets?: PublicProfileFacets;
}

export interface PublicProfileResponse {
  success: boolean;
  message: string;
  data: PublicProfilePaginationData;
}

export interface PublicProfileDetailResponse {
  success: boolean;
  message: string;
  data: PublicProfileData;
}

export interface UploadProfilePhotoRequest {
  file: File;
}
