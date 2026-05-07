"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusOptions = [
  "submitted",
  "reviewed",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
] as const;

const severityOptions = ["low", "medium", "high", "critical"] as const;
const issueTypeOptions = ["pothole", "streetlight"] as const;

export function AdminFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = useMemo(() => {
    const get = (key: string) => searchParams.get(key) ?? "";
    return {
      status: get("status"),
      severity: get("severity"),
      issueType: get("issueType"),
    };
  }, [searchParams]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  function clear() {
    router.replace(pathname);
  }

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select
          value={current.status}
          onValueChange={(v) => setParam("status", v ?? "")}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Severity</Label>
        <Select
          value={current.severity}
          onValueChange={(v) => setParam("severity", v ?? "")}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {severityOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Issue type</Label>
        <Select
          value={current.issueType}
          onValueChange={(v) => setParam("issueType", v ?? "")}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {issueTypeOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button type="button" variant="outline" className="h-10 w-full" onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

