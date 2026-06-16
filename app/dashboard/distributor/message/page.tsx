"use client";

import Header from "../../component/header";
import { ActiveMessagingPanel } from "@/components/messaging/ActiveMessagingPanel";

export default function DistributorMessage() {
  return (
    <div>
      <Header
        title="Messaging"
        description="20th November, 2025"
      />
      <ActiveMessagingPanel
        emptyTitle="No conversation selected"
        emptyDescription="Choose a conversation or start one from an allowed profile."
      />
    </div>
  );
}
