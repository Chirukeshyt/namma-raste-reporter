"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireAdminOrMaintenance } from "@/lib/auth/session";
import { reportStatuses } from "@/lib/reports/status";

const updateSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(reportStatuses),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function updateReportStatusAction(formData: FormData) {
  const parsed = updateSchema.safeParse({
    reportId: formData.get("reportId"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, message: "Please check the status update fields." };
  }

  const { supabase, user } = await requireAdminOrMaintenance();

  const { error: updateError } = await supabase
    .from("reports")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.reportId);

  if (updateError) return { ok: false as const, message: updateError.message };

  const { error: insertError } = await supabase.from("report_updates").insert({
    report_id: parsed.data.reportId,
    status: parsed.data.status,
    note: parsed.data.note || null,
    updated_by: user.id,
  });

  if (insertError) return { ok: false as const, message: insertError.message };

  revalidatePath(`/admin/reports/${parsed.data.reportId}`);
  revalidatePath("/admin");

  return { ok: true as const };
}

