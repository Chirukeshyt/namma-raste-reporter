import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";

import { getUserOrNull } from "@/lib/auth/session";
import { PageHeader } from "@/components/app/page-header";

import { AuthForms } from "./ui/auth-forms";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const { supabase, user } = await getUserOrNull();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin" || profile?.role === "maintenance") redirect("/admin");
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <div className="md:pr-6">
          <PageHeader
            title="Sign in"
            description="Log in to submit reports and manage your tickets."
          />
          <div className="space-y-3 rounded-2xl border bg-background/70 p-5">
            <div className="text-sm font-medium">Why login?</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Prevent spam and duplicate submissions</li>
              <li>• See all your reports in one dashboard</li>
              <li>• Get ticket emails with tracking link</li>
            </ul>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 via-emerald-500/10 to-sky-500/10 p-4 text-sm">
              <div className="font-medium">Tip</div>
              <div className="text-muted-foreground">
                Use a clear photo and select severity carefully for faster resolution.
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full border-muted/60 bg-background/80">
          <CardHeader>
            <CardTitle className="text-xl">Continue to Namma-Raste Reporter</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sign-in" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">Sign in</TabsTrigger>
                <TabsTrigger value="sign-up">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="sign-in" className="mt-4">
                <AuthForms mode="sign-in" />
              </TabsContent>
              <TabsContent value="sign-up" className="mt-4">
                <AuthForms mode="sign-up" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

