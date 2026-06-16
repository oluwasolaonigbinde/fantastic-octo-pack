"use client";

import { useParams } from "next/navigation";

import SubmitterKycView from "@/components/kyc/submitter-kyc-view";
import { UserRole } from "@/types/user";

export default function BuyerKycVerificationDetailPage() {
  const params = useParams();
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;

  return <SubmitterKycView role={UserRole.BUYER} selectedTierSlug={tier} />;
}
