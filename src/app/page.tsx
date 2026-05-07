import Link from "next/link";
import { ArrowRight, Camera, MapPin, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex-1">
      <main>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="pointer-events-none absolute -top-32 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-emerald-500/20 to-sky-500/15 blur-3xl animate-glow" />
          <div className="pointer-events-none absolute -bottom-52 right-[-120px] size-[520px] rounded-full bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-primary/15 blur-3xl animate-floaty" />
          <div className="relative mx-auto w-full max-w-5xl px-4 py-14 md:py-20">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Mobile-first</Badge>
                  <Badge variant="secondary">Photo + GPS</Badge>
                  <Badge variant="secondary">Realtime updates</Badge>
                </div>
                <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                  Fix roads faster with one-click reporting.
                </h1>
                <p className="text-pretty text-base text-muted-foreground md:text-lg">
                  Namma-Raste Reporter helps citizens report potholes and broken streetlights with a
                  photo, GPS, severity, and a human-friendly Ticket ID to track progress.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                  >
                    <Link href="/report">Report an Issue</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 px-6 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Link href="/track">Track Ticket</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Authenticated submissions reduce spam and improve resolution speed.
                </p>

                <div className="grid gap-2 pt-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm">
                    <Zap className="size-4 text-primary" />
                    <span className="text-muted-foreground">Submit in minutes, not forms</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-300" />
                    <span className="text-muted-foreground">RLS-secured citizen reports</span>
                  </div>
                </div>
              </div>

              <Card className="border-muted/60 bg-background/70 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">How it works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Camera className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Capture evidence</div>
                      <div className="text-sm text-muted-foreground">
                        Use camera capture or upload. Preview keeps the original aspect ratio.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Share location</div>
                      <div className="text-sm text-muted-foreground">
                        GPS auto-capture with a friendly manual fallback when permissions fail.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                      <ArrowRight className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Get a Ticket ID</div>
                      <div className="text-sm text-muted-foreground">
                        Receive an ID like <span className="font-mono">NR-2026-000123</span> and track
                        status updates in realtime.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-muted/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Safe Mobility</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Faster reporting reduces accidents and improves commute reliability.
              </CardContent>
            </Card>
            <Card className="border-muted/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Smart Cities & Villages</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Location-first data enables better triage and maintenance routing.
              </CardContent>
            </Card>
            <Card className="border-muted/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Clear severity + photo evidence means fewer follow-ups and quicker assignment.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y bg-muted/20">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
              <div className="space-y-2">
                <div className="text-sm font-medium text-primary">FAQ</div>
                <h2 className="text-2xl font-semibold tracking-tight">Common questions</h2>
                <p className="text-sm text-muted-foreground">
                  Designed for speed, privacy, and accountability.
                </p>
              </div>

              <div className="grid gap-3">
                <Card className="border-muted/60">
                  <CardHeader>
                    <CardTitle className="text-base">Do I need to log in?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Yes — authenticated submissions help prevent spam and enable “My Reports” in your
                    dashboard.
                  </CardContent>
                </Card>
                <Card className="border-muted/60">
                  <CardHeader>
                    <CardTitle className="text-base">Can someone else track my ticket?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Anyone with the Ticket ID can view limited tracking details (status + timeline +
                    location). Personal identity is protected by RLS.
                  </CardContent>
                </Card>
                <Card className="border-muted/60">
                  <CardHeader>
                    <CardTitle className="text-base">What if GPS doesn’t work?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    You’ll see manual latitude/longitude inputs so you can still submit quickly.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto w-full max-w-5xl px-4 py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Namma-Raste Reporter · Built for safer streets.
            </div>
            <div className="flex gap-4 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/report">
                Report
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/track">
                Track
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
