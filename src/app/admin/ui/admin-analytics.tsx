import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Analytics = {
  total: number;
  open: number;
  resolved: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  trend_7d: Array<{ day: string; count: number }>;
};

function formatLabel(key: string) {
  return key.replace(/_/g, " ");
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[120px_1fr_60px] items-center gap-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="text-right text-xs font-medium tabular-nums">{value}</div>
    </div>
  );
}

export async function AdminAnalytics() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_dashboard_analytics");
  if (error || !data) {
    const debugPayload = {
      hasError: Boolean(error),
      hasData: Boolean(data),
      message: error?.message ?? "no_data",
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code,
    };
    console.error("[admin] analytics rpc failed", debugPayload);
    return (
      <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Analytics unavailable. Ensure migration{" "}
        <span className="font-mono">0005_admin_analytics_rpc.sql</span> is applied and your user role
        is <span className="font-mono">admin</span> or <span className="font-mono">maintenance</span>.
        <div className="mt-2 rounded-lg border bg-background/70 px-3 py-2 font-mono text-xs text-muted-foreground">
          {JSON.stringify(debugPayload)}
        </div>
      </div>
    );
  }

  const analytics = data as Analytics;

  const statusEntries = Object.entries(analytics.by_status ?? {});
  const severityEntries = Object.entries(analytics.by_severity ?? {});
  const typeEntries = Object.entries(analytics.by_type ?? {});
  const maxStatus = Math.max(0, ...statusEntries.map(([, v]) => v));
  const maxSeverity = Math.max(0, ...severityEntries.map(([, v]) => v));
  const maxType = Math.max(0, ...typeEntries.map(([, v]) => v));

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-sm">Total reports</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{analytics.total}</CardContent>
        </Card>
        <Card className="border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-sm">Open</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-semibold tabular-nums">{analytics.open}</div>
            <Badge variant="secondary">submitted → in progress</Badge>
          </CardContent>
        </Card>
        <Card className="border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-sm">Resolved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{analytics.resolved}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-sm">By status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusEntries.length ? (
              statusEntries
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => <BarRow key={k} label={formatLabel(k)} value={v} max={maxStatus} />)
            ) : (
              <div className="text-sm text-muted-foreground">No data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-sm">By severity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {severityEntries.length ? (
              severityEntries
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => <BarRow key={k} label={formatLabel(k)} value={v} max={maxSeverity} />)
            ) : (
              <div className="text-sm text-muted-foreground">No data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-sm">By issue type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeEntries.length ? (
              typeEntries
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => <BarRow key={k} label={formatLabel(k)} value={v} max={maxType} />)
            ) : (
              <div className="text-sm text-muted-foreground">No data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted/60 bg-background/80">
        <CardHeader>
          <CardTitle className="text-sm">New reports (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.trend_7d?.length ? (
            analytics.trend_7d.map((d) => (
              <div key={d.day} className="grid grid-cols-[120px_1fr_60px] items-center gap-3">
                <div className="text-xs text-muted-foreground">{d.day}</div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    style={{
                      width: `${
                        Math.max(6, Math.round((d.count / Math.max(1, ...analytics.trend_7d.map((x) => x.count))) * 100))
                      }%`,
                    }}
                  />
                </div>
                <div className="text-right text-xs font-medium tabular-nums">{d.count}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No data yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

