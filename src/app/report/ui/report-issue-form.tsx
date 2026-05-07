"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, MapPin, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createReportAction } from "../actions";
import { ReportLocationMap } from "./report-location-map";

const issueTypes = [
  { value: "pothole", label: "Pothole" },
  { value: "streetlight", label: "Broken Streetlight" },
] as const;

const severityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

const potholeSubTypes = [
  { value: "crater", label: "Crater" },
  { value: "patch_failure", label: "Patch failure" },
  { value: "sinkhole", label: "Sinkhole" },
] as const;

const streetlightSubTypes = [
  { value: "flickering", label: "Flickering" },
  { value: "off", label: "Off" },
  { value: "exposed_wire", label: "Exposed wire" },
] as const;

const roadContexts = [
  { value: "main_road", label: "Main road" },
  { value: "residential", label: "Residential" },
  { value: "highway", label: "Highway" },
  { value: "near_school", label: "Near school" },
] as const;

const landmarkChips = [
  "Near bus stop",
  "Near school",
  "Near hospital",
  "Near junction",
  "Near metro/bus stand",
] as const;

const formSchema = z.object({
  issueType: z.enum(["pothole", "streetlight"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  subType: z.string().max(40).optional(),
  roadContext: z.string().max(40).optional(),
  landmark: z.string().max(80).optional(),
  isHazard: z.boolean().optional(),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  manualLatitude: z.string().optional(),
  manualLongitude: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

type GeoState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; latitude: number; longitude: number }
  | { kind: "failed"; message: string };

export function ReportIssueForm() {
  const [isPending, startTransition] = useTransition();

  const [geoState, setGeoState] = useState<GeoState>({ kind: "idle" });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueType: "pothole",
      severity: "medium",
      subType: "",
      roadContext: "",
      landmark: "",
      isHazard: false,
      description: "",
      address: "",
      manualLatitude: "",
      manualLongitude: "",
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function requestLocation() {
    setGeoState({ kind: "loading" });
    if (!navigator.geolocation) {
      setGeoState({ kind: "failed", message: "GPS not supported on this device." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({
          kind: "ready",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        setGeoState({
          kind: "failed",
          message: err.message || "Unable to access GPS. You can enter location manually.",
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10_000 },
    );
  }

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: FormValues) {
    if (!imageFile) {
      toast.error("Please add a photo.");
      return;
    }

    const formData = new FormData();
    formData.set("issueType", values.issueType);
    formData.set("severity", values.severity);
    formData.set("subType", values.subType ?? "");
    formData.set("roadContext", values.roadContext ?? "");
    formData.set("landmark", values.landmark ?? "");
    formData.set("isHazard", values.isHazard ? "true" : "false");
    formData.set("description", values.description ?? "");
    formData.set("address", values.address ?? "");
    formData.set("image", imageFile);

    if (geoState.kind === "ready") {
      formData.set("latitude", String(geoState.latitude));
      formData.set("longitude", String(geoState.longitude));
    } else {
      if (values.manualLatitude) formData.set("latitude", values.manualLatitude);
      if (values.manualLongitude) formData.set("longitude", values.manualLongitude);
    }

    startTransition(async () => {
      const result = await createReportAction(formData);
      if (result && !result.ok) toast.error(result.message);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Card className="overflow-hidden border-muted/60 bg-background/80 shadow-sm transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Camera className="size-4" />
            </span>
            Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="image">Capture or upload</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs text-muted-foreground">
              JPG/PNG/WebP up to 6MB. Tip: include a street name sign/landmark if possible.
            </div>
          </div>

          {previewUrl ? (
            <div className="group overflow-hidden rounded-xl border bg-muted shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected issue preview"
                className="h-64 w-full object-contain bg-black/5 transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          ) : null}

          {imageFile ? (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground truncate">{imageFile.name}</div>
              <Button type="button" variant="outline" size="sm" onClick={() => setImageFile(null)}>
                Retake
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-muted/60 bg-background/80 shadow-sm transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Issue details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Issue type</Label>
            <Select
              value={form.watch("issueType")}
              onValueChange={(v) => form.setValue("issueType", v as any, { shouldValidate: true })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Severity</Label>
            <Select
              value={form.watch("severity")}
              onValueChange={(v) => form.setValue("severity", v as any, { shouldValidate: true })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Category sub-type (optional)</Label>
            <Select
              value={form.watch("subType") ?? ""}
              onValueChange={(v) => form.setValue("subType", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select sub-type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not sure</SelectItem>
                {(form.watch("issueType") === "pothole" ? potholeSubTypes : streetlightSubTypes).map(
                  (s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Road context (optional)</Label>
            <Select
              value={form.watch("roadContext") ?? ""}
              onValueChange={(v) => form.setValue("roadContext", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select road context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not sure</SelectItem>
                {roadContexts.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
            <Checkbox
              id="isHazard"
              checked={Boolean(form.watch("isHazard"))}
              onCheckedChange={(v) => form.setValue("isHazard", Boolean(v))}
            />
            <div className="grid leading-tight">
              <Label htmlFor="isHazard" className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <ShieldAlert className="size-4 text-emerald-600 dark:text-emerald-300" />
                  Immediate danger
                </span>
              </Label>
              <div className="text-xs text-muted-foreground">
                Check this if it’s a serious safety hazard (e.g., deep pothole on main road).
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Optional description</Label>
            <Textarea
              id="description"
              placeholder="Any extra detail that helps the team..."
              className="min-h-24"
              {...form.register("description")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted/60 bg-background/80 shadow-sm transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <MapPin className="size-4" />
            </span>
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {geoState.kind === "loading" ? (
            <div className="text-sm text-muted-foreground">Detecting GPS location…</div>
          ) : null}
          {geoState.kind === "ready" ? (
            <div className="text-sm">
              <div className="font-medium">GPS captured</div>
              <div className="text-muted-foreground">
                {geoState.latitude.toFixed(6)}, {geoState.longitude.toFixed(6)}
              </div>
            </div>
          ) : null}
          {geoState.kind === "failed" ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">{geoState.message}</div>
              <Button type="button" variant="secondary" className="h-10" onClick={requestLocation}>
                Use my current location
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="manualLatitude">Latitude</Label>
                  <Input
                    id="manualLatitude"
                    inputMode="decimal"
                    placeholder="12.9716"
                    {...form.register("manualLatitude")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manualLongitude">Longitude</Label>
                  <Input
                    id="manualLongitude"
                    inputMode="decimal"
                    placeholder="77.5946"
                    {...form.register("manualLongitude")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Live mini-map preview */}
          {(() => {
            const lat =
              geoState.kind === "ready"
                ? geoState.latitude
                : Number(form.watch("manualLatitude") || NaN);
            const lng =
              geoState.kind === "ready"
                ? geoState.longitude
                : Number(form.watch("manualLongitude") || NaN);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return <ReportLocationMap latitude={lat} longitude={lng} />;
          })()}

          <div className="grid gap-2">
            <Label>Nearby landmark (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {landmarkChips.map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  size="sm"
                  variant={form.watch("landmark") === chip ? "default" : "outline"}
                  onClick={() => form.setValue("landmark", chip)}
                >
                  {chip}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Optional nearby landmark / address</Label>
            <Input
              id="address"
              placeholder="Near MG Road Metro..."
              {...form.register("address")}
            />
          </div>
        </CardContent>
      </Card>

      <Button className="h-12 w-full" type="submit" disabled={isPending}>
        Submit report
      </Button>
    </form>
  );
}

