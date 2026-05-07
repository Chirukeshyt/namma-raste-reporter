"use client";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" size="sm" variant="secondary">
        Logout
      </Button>
    </form>
  );
}

