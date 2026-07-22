import { UserRole } from "@/types/user";
import type { KycSubmitterRole, KycTierDefinition } from "@/types/kyc";

/**
 * Static mirror of `baiy-server/src/features/kyc/config.ts`
 * (commit `0558e4a feat: add kyc`).
 *
 * The API (`GET /kyc/tiers`) stays authoritative at runtime — always render
 * from the fetched tiers. This catalogue exists for the things that cannot
 * wait on a request:
 *   - `generateStaticParams` / route-slug validation on `[tier]` pages
 *   - building links before the query resolves
 *   - copy + required-field reference while designing each role's UI
 *
 * If the server config changes, update this file in the same PR.
 */

export const KYC_SUBMITTER_ROLES: KycSubmitterRole[] = [
  UserRole.BUYER,
  UserRole.DISTRIBUTOR,
  UserRole.OEM,
  UserRole.ENGINEER,
];

/** Dashboard base path per role — detail route is `${base}/${routeSlug}`. */
export const KYC_ROLE_PATHS: Record<KycSubmitterRole, string> = {
  [UserRole.BUYER]: "/dashboard/buyer/kyc-verification",
  [UserRole.DISTRIBUTOR]: "/dashboard/distributor/kyc-verification",
  [UserRole.OEM]: "/dashboard/oem/kyc-verification",
  [UserRole.ENGINEER]: "/dashboard/engineer/kyc-verification",
};

const autoGrantedTier = (
  tierKey: string,
  tierLabel: string,
): Omit<KycTierDefinition, "tierKey" | "tierLabel"> &
  Pick<KycTierDefinition, "tierKey" | "tierLabel"> => ({
  tierKey,
  routeSlug: tierKey,
  tierLabel,
  tierOrdinal: 1,
  processingTime: null,
  isAutoGranted: true,
  submissionBehavior: "none",
  requiredTextFields: [],
  requiredDocuments: [],
  detailTitle: tierLabel,
  detailSubtitle: "Account access is based on signup completion.",
  badgeLabel: null,
  prerequisiteTierKey: null,
});

export const KYC_TIERS_BY_ROLE: Record<KycSubmitterRole, KycTierDefinition[]> = {
  [UserRole.BUYER]: [
    autoGrantedTier("basic_buyer", "Basic Buyer"),
    {
      tierKey: "verified_business_buyer",
      routeSlug: "verified-business-buyer",
      tierLabel: "Verified Business Buyer",
      tierOrdinal: 2,
      processingTime: "Manual review",
      isAutoGranted: false,
      submissionBehavior: "review_required",
      requiredTextFields: [],
      requiredDocuments: [
        { fieldName: "cac_certificate", label: "CAC certificate", minimumCount: 1 },
        { fieldName: "cac_status_report", label: "CAC status report", minimumCount: 1 },
      ],
      detailTitle: "Business verification",
      detailSubtitle: "Upload CAC documents for manual business verification.",
      badgeLabel: "Verified Business Buyer",
      prerequisiteTierKey: null,
    },
  ],

  [UserRole.DISTRIBUTOR]: [
    autoGrantedTier("basic_distributor", "Basic Distributor"),
    {
      tierKey: "registered_distributor",
      routeSlug: "registered-distributor",
      tierLabel: "Registered Distributor",
      tierOrdinal: 2,
      processingTime: "Manual review",
      isAutoGranted: false,
      submissionBehavior: "review_required",
      requiredTextFields: [
        { fieldName: "countryOfOrigin", label: "Country of origin", inputType: "text" },
        { fieldName: "businessName", label: "Business name", inputType: "text" },
        { fieldName: "state", label: "State", inputType: "text" },
        { fieldName: "city", label: "City", inputType: "text" },
      ],
      requiredDocuments: [],
      detailTitle: "Registered Distributor",
      detailSubtitle:
        "Submit distributor business details for manual approval and marketplace activation.",
      badgeLabel: null,
      prerequisiteTierKey: null,
    },
    {
      tierKey: "verified_distributor",
      routeSlug: "verified-distributor",
      tierLabel: "Verified Distributor",
      tierOrdinal: 3,
      processingTime: "Manual review",
      isAutoGranted: false,
      submissionBehavior: "review_required",
      requiredTextFields: [
        {
          fieldName: "identityDocumentType",
          label: "Identity document type",
          inputType: "text",
        },
        {
          fieldName: "identityDocumentNumber",
          label: "Identity document number",
          inputType: "text",
        },
      ],
      requiredDocuments: [
        { fieldName: "identity_document", label: "Government ID card", minimumCount: 1 },
        { fieldName: "cac_certificate", label: "CAC certificate", minimumCount: 1 },
        { fieldName: "cac_status_report", label: "CAC status report", minimumCount: 1 },
      ],
      detailTitle: "Distributor verification",
      detailSubtitle: "Submit identity and business evidence for manual review.",
      badgeLabel: "Verified Distributor",
      prerequisiteTierKey: "registered_distributor",
    },
    {
      tierKey: "premium_distributor",
      routeSlug: "premium-distributor",
      tierLabel: "Premium Distributor",
      tierOrdinal: 4,
      processingTime: null,
      isAutoGranted: false,
      submissionBehavior: "admin_only",
      requiredTextFields: [],
      requiredDocuments: [],
      detailTitle: "Premium Distributor",
      detailSubtitle: "Premium recognition is awarded only by Baiy administrators.",
      badgeLabel: "Premium Distributor",
      prerequisiteTierKey: "verified_distributor",
    },
  ],

  [UserRole.OEM]: [
    autoGrantedTier("basic_oem", "Basic OEM"),
    {
      tierKey: "registered_manufacturer",
      routeSlug: "registered-manufacturer",
      tierLabel: "Registered Manufacturer",
      tierOrdinal: 2,
      processingTime: "Manual review",
      isAutoGranted: false,
      submissionBehavior: "review_required",
      requiredTextFields: [
        { fieldName: "companyName", label: "Company name", inputType: "text" },
        { fieldName: "countryOfOrigin", label: "Country of origin", inputType: "text" },
        { fieldName: "state", label: "State", inputType: "text" },
        { fieldName: "city", label: "City", inputType: "text" },
        { fieldName: "companyAddress", label: "Company address", inputType: "text" },
      ],
      requiredDocuments: [
        {
          fieldName: "national_id_document",
          label: "National ID document",
          minimumCount: 1,
        },
      ],
      detailTitle: "Registered Manufacturer",
      detailSubtitle:
        "Submit company and identity evidence for manual approval and marketplace activation.",
      badgeLabel: null,
      prerequisiteTierKey: null,
    },
    {
      tierKey: "verified_manufacturer",
      routeSlug: "verified-manufacturer",
      tierLabel: "Verified Manufacturer",
      tierOrdinal: 3,
      processingTime: "Manual review",
      isAutoGranted: false,
      submissionBehavior: "review_required",
      requiredTextFields: [],
      requiredDocuments: [
        {
          fieldName: "business_registration_certificate",
          label: "Business registration certificate",
          minimumCount: 1,
        },
        { fieldName: "factory_images", label: "Factory images", minimumCount: 1 },
        { fieldName: "supporting_document", label: "Supporting document", minimumCount: 1 },
      ],
      detailTitle: "Manufacturer verification",
      detailSubtitle:
        "Submit business registration, factory, and supporting evidence for manual review.",
      badgeLabel: "Verified Manufacturer",
      prerequisiteTierKey: null,
    },
    {
      tierKey: "premium_manufacturer",
      routeSlug: "premium-manufacturer",
      tierLabel: "Premium Manufacturer",
      tierOrdinal: 4,
      processingTime: null,
      isAutoGranted: false,
      submissionBehavior: "admin_only",
      requiredTextFields: [],
      requiredDocuments: [],
      detailTitle: "Premium Manufacturer",
      detailSubtitle: "Premium recognition is awarded only by Baiy administrators.",
      badgeLabel: "Premium Manufacturer",
      prerequisiteTierKey: "verified_manufacturer",
    },
  ],

  [UserRole.ENGINEER]: [
    autoGrantedTier("basic_engineer", "Basic Engineer"),
    {
      tierKey: "verified_engineer",
      routeSlug: "verified-engineer",
      tierLabel: "Verified Engineer",
      tierOrdinal: 2,
      processingTime: "Manual review",
      isAutoGranted: false,
      submissionBehavior: "review_required",
      requiredTextFields: [
        {
          fieldName: "identityDocumentNumber",
          label: "Identity document number",
          inputType: "text",
        },
      ],
      requiredDocuments: [
        {
          fieldName: "identity_document",
          label: "Government identity document",
          minimumCount: 1,
        },
      ],
      detailTitle: "Engineer verification",
      detailSubtitle:
        "Submit an identity document and any supporting professional evidence.",
      badgeLabel: "Verified Engineer",
      prerequisiteTierKey: null,
    },
    {
      tierKey: "premium_engineer",
      routeSlug: "premium-engineer",
      tierLabel: "Premium Engineer",
      tierOrdinal: 3,
      processingTime: null,
      isAutoGranted: false,
      submissionBehavior: "admin_only",
      requiredTextFields: [],
      requiredDocuments: [],
      detailTitle: "Premium Engineer",
      detailSubtitle: "Premium recognition is awarded only by Baiy administrators.",
      badgeLabel: "Premium Engineer",
      prerequisiteTierKey: "verified_engineer",
    },
  ],
};

export const ALL_KYC_TIERS: KycTierDefinition[] =
  KYC_SUBMITTER_ROLES.flatMap((role) => KYC_TIERS_BY_ROLE[role]);

export const isKycSubmitterRole = (role: unknown): role is KycSubmitterRole =>
  KYC_SUBMITTER_ROLES.includes(role as KycSubmitterRole);

export const getKycTiersForRole = (role: KycSubmitterRole): KycTierDefinition[] =>
  KYC_TIERS_BY_ROLE[role] ?? [];

export const getKycTierBySlug = (
  role: KycSubmitterRole,
  routeSlug: string,
): KycTierDefinition | undefined =>
  getKycTiersForRole(role).find((tier) => tier.routeSlug === routeSlug);

export const getKycTierByKey = (
  role: KycSubmitterRole,
  tierKey: string,
): KycTierDefinition | undefined =>
  getKycTiersForRole(role).find((tier) => tier.tierKey === tierKey);

/** Route params for `app/dashboard/<role>/kyc-verification/[tier]`. */
export const kycTierStaticParams = (role: KycSubmitterRole) =>
  getKycTiersForRole(role).map((tier) => ({ tier: tier.routeSlug }));
