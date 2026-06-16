"use client";

import { useParams } from "next/navigation";

import DistributorKycView from "@/components/kyc/distributor-kyc-view";

export default function DistributorKycVerificationDetailPage() {
  const params = useParams();
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;

  return <DistributorKycView selectedTierSlug={tier} />;
}
