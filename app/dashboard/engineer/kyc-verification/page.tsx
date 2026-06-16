"use client";

import SubmitterKycView from "@/components/kyc/submitter-kyc-view";
import { UserRole } from "@/types/user";

export default function EngineerKycVerificationPage() {
  return <SubmitterKycView role={UserRole.ENGINEER} />;
}
