"use client";

import { ActiveMessagingPanel } from "@/components/messaging/ActiveMessagingPanel";

export function EngineerMessagingShell() {
  return (
    <ActiveMessagingPanel
      emptyTitle="No conversation selected"
      emptyDescription="Choose a conversation or start one from an allowed profile."
    />
  );
}
