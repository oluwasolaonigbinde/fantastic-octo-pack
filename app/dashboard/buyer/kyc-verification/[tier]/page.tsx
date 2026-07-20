"use client";

import { useParams } from "next/navigation";

import BuyerKycView from "@/components/kyc/buyer-kyc-view";

export default function BuyerKycVerificationDetailPage() {
  const params = useParams();
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;

  return <BuyerKycView selectedTierSlug={tier} />;
}
