"use client";

import { useParams } from "next/navigation";

import EngineerKycView from "@/components/kyc/engineer-kyc-view";

export default function EngineerKycVerificationDetailPage() {
  const params = useParams();
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;

  return <EngineerKycView selectedTierSlug={tier} />;
}
