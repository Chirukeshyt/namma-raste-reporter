import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { formatStatus } from "@/lib/reports/status";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role,created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: reports } = await supabase
    .from("reports")
    .select("id,ticket_id,issue_type,severity,status,address,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const fullName = profile?.full_name?.trim() ? profile.full_name : "Citizen";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title="Your dashboard"
        description="Track your reports, ticket status, and updates in one place."
        actions={
          <>
            <Button asChild className="h-10">
              <Link href="/report">Report</Link>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <Link href="/track">Track</Link>
            </Button>
          </>
        }
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Welcome, {fullName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              This is your dashboard to track all reports you’ve submitted.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="h-11">
                <Link href="/report">Report a new issue</Link>
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link href="/track">Track by Ticket ID</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{profile?.role ?? "citizen"}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your reported issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border bg-background/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">
                      <Link
                        href={`/ticket/${r.ticket_id}`}
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
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!reports?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No reports yet. Create your first one from{" "}
                      <Link href="/report" className="underline underline-offset-4">
                        Report
                      </Link>
                      .
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

