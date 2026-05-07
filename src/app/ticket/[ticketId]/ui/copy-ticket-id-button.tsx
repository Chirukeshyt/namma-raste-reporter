"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyTicketIdButton({ ticketId }: { ticketId: string }) {
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(ticketId);
      toast.success("Ticket ID copied.");
    } catch {
      toast.error("Could not copy. Please copy manually.");
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={onCopy}>
      Copy
    </Button>
  );
}

