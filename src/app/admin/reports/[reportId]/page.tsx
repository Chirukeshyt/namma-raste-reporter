import { notFound } from "next/navigation";

import { requireAdminOrMaintenance } from "@/lib/auth/session";

import { AdminReportRealtime } from "./ui/admin-report-realtime";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ reportId: string }> };

export default async function AdminReportDetailPage({ params }: PageProps) {
  const { reportId } = await params;
  const { supabase } = await requireAdminOrMaintenance();

  const { data: report } = await supabase
    .from("reports")
    .select(
      "id,ticket_id,issue_type,severity,sub_type,road_context,landmark,is_hazard,description,image_url,latitude,longitude,address,status,created_at,updated_at",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (!report) notFound();

  const { data: updates } = await supabase
    .from("report_updates")
    .select("id,status,note,created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  let signedImageUrl: string | null = null;
  if (report.image_url) {
    const { data, error } = await supabase.storage
      .from("reports")
      .createSignedUrl(report.image_url, 60 * 30);
    if (error) {
      console.error("[admin] createSignedUrl failed", {
        reportId,
        imageUrl: report.image_url,
        message: error.message,
      });
    }
    signedImageUrl = data?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
        <p className="text-sm text-muted-foreground font-mono">{report.ticket_id}</p>
      </div>

      <AdminReportRealtime
        initialReport={report}
        initialUpdates={updates ?? []}
        signedImageUrl={signedImageUrl}
      />
    </main>
  );
}

