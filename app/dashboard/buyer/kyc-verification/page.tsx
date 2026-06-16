"use client";

import SubmitterKycView from "@/components/kyc/submitter-kyc-view";
import { UserRole } from "@/types/user";

export default function BuyerKycVerificationPage() {
  return <SubmitterKycView role={UserRole.BUYER} />;
}
