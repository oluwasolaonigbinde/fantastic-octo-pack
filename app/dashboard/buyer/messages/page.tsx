"use client";

import Header from "../../component/header";
import { ActiveMessagingPanel } from "@/components/messaging/ActiveMessagingPanel";

export default function BuyerMessages() {
  return (
    <div>
      <Header
        title="Messages"
        description="Send and see all messages from distributors"
      />
      <ActiveMessagingPanel
        emptyTitle="No conversation selected"
        emptyDescription="Choose a conversation or start one from an allowed profile."
      />
    </div>
  );
}
