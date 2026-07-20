"use client";

import { useParams } from "next/navigation";

import OemKycView from "@/components/kyc/oem-kyc-view";

export default function OemKycVerificationDetailPage() {
  const params = useParams();
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;

  return <OemKycView selectedTierSlug={tier} />;
}
