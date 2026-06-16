"use client";

import { useParams } from "next/navigation";

import SubmitterKycView from "@/components/kyc/submitter-kyc-view";
import { UserRole } from "@/types/user";

export default function EngineerKycVerificationDetailPage() {
  const params = useParams();
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;

  return <SubmitterKycView role={UserRole.ENGINEER} selectedTierSlug={tier} />;
}
