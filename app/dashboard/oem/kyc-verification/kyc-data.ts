export interface OemKycTierRecord {
  id: string;
  label: string;
  processingTime?: string;
  routeSlug: string;
  showInfoIcon?: boolean;
}

export interface OemKycDetailRecord {
  slug: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "approved" | "pending";
  fields: Array<{ label: string; value: string }>;
  avatarUrl?: string;
}

export const OEM_KYC_TIERS: OemKycTierRecord[] = [
  { id: "unverified", label: "Unverified", routeSlug: "unverified" },
  { id: "basic", label: "Basic OEMs", routeSlug: "basic", showInfoIcon: true },
  {
    id: "cooperate",
    label: "Cooperate OEMs",
    processingTime: "Processing time 48 hours",
    routeSlug: "cooperate",
    showInfoIcon: true,
  },
  {
    id: "verified-1",
    label: "Verified OEM",
    processingTime: "Processing time 48 hours",
    routeSlug: "verified-oem",
    showInfoIcon: true,
  },
  {
    id: "verified-2",
    label: "Verified OEM",
    processingTime: "Processing time 48 hours",
    routeSlug: "tier-3",
    showInfoIcon: true,
  },
];

export const OEM_KYC_DETAILS: OemKycDetailRecord[] = [
  {
    slug: "unverified",
    title: "Unverified OEM requirement",
    subtitle: "View all uploaded requirement",
    statusLabel: "Pending",
    statusTone: "pending",
    fields: [
      { label: "Work email verification", value: "Pending submission" },
      { label: "Claimed company name", value: "Not yet uploaded" },
      { label: "Phone number", value: "Pending submission" },
    ],
  },
  {
    slug: "basic",
    title: "Basic OEM uploaded document",
    subtitle: "View all uploaded requirement",
    statusLabel: "Approved",
    statusTone: "approved",
    fields: [
      { label: "First name", value: "BAIY LTD" },
      { label: "Last name", value: "BAIY LTD" },
      { label: "Claimed company name", value: "BAIY LTD" },
      { label: "First Email address", value: "example2@gmail.com" },
      { label: "Phone number", value: "08184318676" },
    ],
  },
  {
    slug: "cooperate",
    title: "Cooperate OEM uploaded requirement",
    subtitle: "View all uploaded requirement",
    statusLabel: "Pending",
    statusTone: "pending",
    fields: [
      { label: "CAC registration", value: "Under review" },
      { label: "Claimed company name", value: "BAIY LTD" },
      { label: "Work email verification", value: "Pending review" },
    ],
  },
  {
    slug: "verified-oem",
    title: "Verified OEM uploaded requirement",
    subtitle: "View all uploaded requirement",
    statusLabel: "Approved",
    statusTone: "approved",
    fields: [
      { label: "Claimed company name", value: "BAIY LTD" },
      { label: "Work email verification", value: "verified@baiy.com" },
      { label: "Phone number", value: "08184318676" },
    ],
  },
  {
    slug: "tier-3",
    title: "Tier 3 uploaded requirement",
    subtitle: "View all uploaded requirement",
    statusLabel: "Pending",
    statusTone: "pending",
    avatarUrl: "/images/profile.png",
    fields: [
      { label: "NIN", value: "2348235855UB55" },
      { label: "Work email verification", value: "Wuse zone 3 Abuja" },
      { label: "Claimed company name", value: "BAIY LTD" },
    ],
  },
];
