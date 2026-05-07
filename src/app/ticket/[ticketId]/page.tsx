import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatStatus } from "@/lib/reports/status";

import { CopyTicketIdButton } from "./ui/copy-ticket-id-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ ticketId: string }> };

export default async function TicketConfirmationPage({ params }: PageProps) {
  const { ticketId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: report } = await supabase
    .from("reports")
    .select(
      "id,ticket_id,issue_type,severity,description,image_url,latitude,longitude,address,status,created_at",
    )
    .eq("ticket_id", ticketId)
    .maybeSingle();

  if (!report) notFound();

  // RLS already enforces ownership/admin for select.

  let signedImageUrl: string | null = null;
  if (report.image_url) {
    const { data } = await supabase.storage
      .from("reports")
      .createSignedUrl(report.image_url, 60 * 30);
    signedImageUrl = data?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ticket created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Ticket ID</div>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <div className="font-mono text-base font-semibold">{report.ticket_id}</div>
              <CopyTicketIdButton ticketId={report.ticket_id} />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{report.issue_type}</Badge>
              <Badge variant="outline">{report.severity}</Badge>
              <Badge>{formatStatus(report.status)}</Badge>
            </div>

            {signedImageUrl ? (
              <div className="overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signedImageUrl}
                  alt="Reported issue"
                  className="h-72 w-full object-contain bg-black/5"
                />
              </div>
            ) : null}

            <div className="text-sm text-muted-foreground">
              Submitted: {new Date(report.created_at).toLocaleString()}
            </div>
            {report.address ? (
              <div className="text-sm">
                <span className="font-medium">Location:</span>{" "}
                <span className="text-muted-foreground">{report.address}</span>
              </div>
            ) : null}
            {report.description ? (
              <div className="text-sm">
                <span className="font-medium">Description:</span>{" "}
                <span className="text-muted-foreground">{report.description}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link href={`/track?ticketId=${encodeURIComponent(report.ticket_id)}`}>
                Track status
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link href="/report">Report another</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

