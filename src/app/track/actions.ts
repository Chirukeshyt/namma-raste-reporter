"use server";

import { z } from "zod";

import { createSupabaseAnonClient, createSupabaseServiceClient } from "@/lib/supabase/service";

const ticketSchema = z.object({
  ticketId: z
    .string()
    .trim()
    .min(6)
    .max(32)
    .regex(/^NR-\d{4}-\d{6}$/i, "Invalid ticket format."),
});

type TrackTicketResult =
  | { ok: true; data: any }
  | { ok: false; message: string };

export async function trackTicketAction(formData: FormData): Promise<TrackTicketResult> {
  const parsed = ticketSchema.safeParse({
    ticketId: formData.get("ticketId"),
  });
  if (!parsed.success) return { ok: false, message: "Please enter a valid Ticket ID." };

  const anon = createSupabaseAnonClient();
  if (!anon) return { ok: false, message: "Server is missing Supabase env." };

  const { data, error } = await anon.rpc("track_ticket", {
    p_ticket_id: parsed.data.ticketId.toUpperCase(),
  });
  if (error) return { ok: false, message: error.message };

  if (!data?.found) return { ok: false, message: "Ticket not found." };

  // If we have a service role key, return a time-limited image URL (safe for anon viewers).
  if (data.image_url) {
    const service = createSupabaseServiceClient();
    if (service) {
      const { data: signed } = await service.storage
        .from("reports")
        .createSignedUrl(data.image_url, 60 * 20);
      data.image_signed_url = signed?.signedUrl ?? null;
    }
  }

  return { ok: true, data };
}

