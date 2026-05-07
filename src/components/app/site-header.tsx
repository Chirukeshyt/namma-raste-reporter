import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getUserOrNull } from "@/lib/auth/session";

import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const { supabase, user } = await getUserOrNull();

  let showAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    showAdmin = profile?.role === "admin" || profile?.role === "maintenance";
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/90 to-emerald-500/90 text-primary-foreground shadow-sm">
            <span className="text-sm font-bold tracking-tight">NR</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-muted-foreground">Civic-tech reporting</span>
            <span className="text-lg font-semibold tracking-tight">Namma-Raste Reporter</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/report"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/60"
          >
            Report
          </Link>
          <Link
            href="/track"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/60"
          >
            Track
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/60"
          >
            Dashboard
          </Link>
          {showAdmin ? (
            <Link
              href="/admin"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/60"
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <LogoutButton />
          ) : (
            <Button asChild type="button" size="sm">
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

