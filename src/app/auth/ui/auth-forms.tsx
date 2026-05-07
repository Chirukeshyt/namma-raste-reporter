"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { signInAction, signUpAction } from "../actions";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

type Mode = "sign-in" | "sign-up";

export function AuthForms({ mode }: { mode: Mode }) {
  const [isPending, startTransition] = useTransition();

  const schema = mode === "sign-up" ? signUpSchema : signInSchema;
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema as any),
    defaultValues: (mode === "sign-up"
      ? { fullName: "", email: "", password: "" }
      : { email: "", password: "" }) as any,
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values as any)) {
        formData.set(key, String(value ?? ""));
      }

      const result =
        mode === "sign-up" ? await signUpAction(formData) : await signInAction(formData);

      if (result && !result.ok) toast.error(result.message);
    });
  }

  const showFullName = mode === "sign-up";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {showFullName ? (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Your name"
            {...(form.register("fullName" as any) as any)}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...(form.register("email" as any) as any)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          {...(form.register("password" as any) as any)}
        />
      </div>

      <Button className="h-11 w-full" type="submit" disabled={isPending}>
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

