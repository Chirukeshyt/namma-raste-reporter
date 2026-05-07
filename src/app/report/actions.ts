"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendReportCreatedEmail } from "@/lib/email/smtp";

const reportSchema = z.object({
  issueType: z.enum(["pothole", "streetlight"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  subType: z.string().max(40).optional().or(z.literal("")),
  roadContext: z.string().max(40).optional().or(z.literal("")),
  landmark: z.string().max(80).optional().or(z.literal("")),
  isHazard: z.coerce.boolean().optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  latitude: z.coerce.number().finite().optional(),
  longitude: z.coerce.number().finite().optional(),
  address: z.string().max(200).optional().or(z.literal("")),
});

function requireImage(file: File | null) {
  if (!file) return { ok: false as const, message: "Please add a photo." };
  if (!file.type.startsWith("image/")) {
    return { ok: false as const, message: "Only image uploads are supported." };
  }
  const maxBytes = 6 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false as const, message: "Image is too large (max 6MB)." };
  }
  return { ok: true as const };
}

export async function createReportAction(formData: FormData) {
  const parsed = reportSchema.safeParse({
    issueType: formData.get("issueType"),
    severity: formData.get("severity"),
    subType: formData.get("subType") ?? "",
    roadContext: formData.get("roadContext") ?? "",
    landmark: formData.get("landmark") ?? "",
    isHazard: formData.get("isHazard") ?? "false",
    description: formData.get("description") ?? "",
    latitude: formData.get("latitude") ?? undefined,
    longitude: formData.get("longitude") ?? undefined,
    address: formData.get("address") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, message: "Please check the form fields." };
  }

  const image = formData.get("image");
  const imageFile = image instanceof File ? image : null;
  const imageCheck = requireImage(imageFile);
  if (!imageCheck.ok) return imageCheck;
  if (!imageFile) return { ok: false as const, message: "Please add a photo." };

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/auth");

  // 1) Create the report row first (ticket_id generated in DB trigger)
  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert({
      ticket_id: "", // trigger will populate
      user_id: userData.user.id,
      issue_type: parsed.data.issueType,
      severity: parsed.data.severity,
      sub_type: parsed.data.subType || null,
      road_context: parsed.data.roadContext || null,
      landmark: parsed.data.landmark || null,
      is_hazard: parsed.data.isHazard ?? false,
      description: parsed.data.description || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      address: parsed.data.address || null,
      status: "submitted",
    })
    .select("id,ticket_id")
    .single();

  if (insertError || !inserted) {
    return { ok: false as const, message: insertError?.message ?? "Failed to create report." };
  }

  // 2) Upload image to storage under <uid>/<reportId>.<ext>
  const extension =
    imageFile.type === "image/png"
      ? "png"
      : imageFile.type === "image/webp"
        ? "webp"
        : "jpg";
  const objectPath = `${userData.user.id}/${inserted.id}.${extension}`;

  const bytes = new Uint8Array(await imageFile.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(objectPath, bytes, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) {
    // best-effort cleanup: keep the report for auditability, but mark missing image
    return { ok: false as const, message: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({ image_url: objectPath })
    .eq("id", inserted.id);

  if (updateError) {
    return { ok: false as const, message: updateError.message };
  }

  // 3) Email the reporter (best-effort; don't block success if SMTP is down)
  try {
    const toEmail = userData.user.email ?? "";
    if (toEmail) {
      await sendReportCreatedEmail({
        toEmail,
        ticketId: inserted.ticket_id,
        issueType: parsed.data.issueType,
        severity: parsed.data.severity,
        description: parsed.data.description || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        address: parsed.data.address || null,
        createdAtIso: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Intentionally ignore email errors to keep reporting fast/reliable.
    console.error("[email] report created email failed", {
      ticketId: inserted.ticket_id,
      toEmail: userData.user.email ?? null,
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
    });
  }

  redirect(`/ticket/${inserted.ticket_id}`);
}

