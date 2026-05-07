import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminOrMaintenance } from "@/lib/auth/session";
import { formatStatus } from "@/lib/reports/status";
import { PageHeader } from "@/components/app/page-header";

import { AdminFilters } from "./ui/admin-filters";
import { AdminMap } from "./ui/admin-map";
import { AdminAnalytics } from "./ui/admin-analytics";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { supabase, role } = await requireAdminOrMaintenance();
  const params = await searchParams;

  const status = typeof params.status === "string" ? params.status : undefined;
  const severity = typeof params.severity === "string" ? params.severity : undefined;
  const issueType = typeof params.issueType === "string" ? params.issueType : undefined;

  let query = supabase
    .from("reports")
    .select(
      "id,ticket_id,issue_type,severity,status,is_hazard,sub_type,road_context,landmark,latitude,longitude,address,created_at,image_url",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);
  if (issueType) query = query.eq("issue_type", issueType);

  const { data: reports } = await query;

  const signedImageUrlsByReportId = new Map<string, string>();
  const reportsWithImages = (reports ?? []).filter((r) => Boolean(r.image_url)).slice(0, 80);
  await Promise.all(
    reportsWithImages.map(async (r) => {
      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(r.image_url as string, 60 * 20);
      if (error) {
        console.error("[admin] thumbnail createSignedUrl failed", {
          reportId: r.id,
          imageUrl: r.image_url,
          message: error.message,
        });
        return;
      }
      if (data?.signedUrl) signedImageUrlsByReportId.set(r.id, data.signedUrl);
    }),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title="Admin dashboard"
        description={`Role: ${role}. Triage reports, update status, and manage field operations.`}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAnalytics />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminFilters />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Map</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMap
            reports={(reports ?? []).map((r) => {
              const latitude = r.latitude === null ? null : Number(r.latitude);
              const longitude = r.longitude === null ? null : Number(r.longitude);
              return {
                id: r.id,
                ticketId: r.ticket_id,
                issueType: r.issue_type,
                severity: r.severity,
                status: r.status,
                latitude: Number.isFinite(latitude) ? latitude : null,
                longitude: Number.isFinite(longitude) ? longitude : null,
                address: r.address,
              };
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border bg-background/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {signedImageUrlsByReportId.get(r.id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signedImageUrlsByReportId.get(r.id)}
                          alt="Report photo"
                          className="h-10 w-14 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded-md border bg-muted/40" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="underline underline-offset-4"
                      >
                        {r.ticket_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.issue_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{formatStatus(r.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.is_hazard ? <Badge variant="destructive">Hazard</Badge> : null}
                        {r.sub_type ? <Badge variant="secondary">{r.sub_type}</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!reports?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

