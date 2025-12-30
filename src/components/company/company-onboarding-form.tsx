"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  companyOnboardingSchema,
  type CompanyOnboardingInput,
} from "@/lib/validators/onboarding";
import { Region, WarehouseType } from "@/types";

const regionOptions = Object.values(Region);
const warehouseOptions = Object.values(WarehouseType);

const warehouseLabels: Record<WarehouseType, string> = {
  [WarehouseType.WAREHOUSE]: "Sklad",
  [WarehouseType.FULFILLMENT]: "Fulfillment centrum",
  [WarehouseType.RETAIL_DISTRIBUTION]: "Retail distribúcia",
  [WarehouseType.PRODUCTION_SUPPORT]: "Výrobná podpora",
  [WarehouseType.OTHER]: "Iné",
};

type Props = {
  initialValues?: CompanyOnboardingInput | undefined;
};

export function CompanyOnboardingForm({ initialValues }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<CompanyOnboardingInput>({
    resolver: zodResolver(companyOnboardingSchema),
    defaultValues: initialValues ?? {
      companyName: "",
      siteName: "",
      ico: "",
      addressStreet: "",
      addressCity: "",
      addressZip: "",
      contactName: "",
      contactPhone: "",
      warehouseType: WarehouseType.WAREHOUSE,
      region: Region.BA,
    },
  });

  const handleSubmit = (values: CompanyOnboardingInput) => {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/company/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data?.error ?? "Profil firmy sa nepodarilo uložiť");
        return;
      }

      router.push("/company/dashboard");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6 rounded-3xl border border-border bg-card/80 p-6 shadow"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="companyName">Názov firmy</Label>
          <Input id="companyName" {...form.register("companyName")} />
          {form.formState.errors.companyName ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.companyName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteName">Názov prevádzky (nepovinné)</Label>
          <Input id="siteName" {...form.register("siteName")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="addressStreet">Ulica</Label>
          <Input id="addressStreet" {...form.register("addressStreet")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addressCity">Mesto</Label>
          <Input id="addressCity" {...form.register("addressCity")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addressZip">PSČ</Label>
          <Input id="addressZip" {...form.register("addressZip")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="region">Región</Label>
          <Select id="region" {...form.register("region")}>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="warehouseType">Typ prevádzky</Label>
          <Select id="warehouseType" {...form.register("warehouseType")}>
            {warehouseOptions.map((type) => (
              <option key={type} value={type}>
                {warehouseLabels[type]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="contactName">Kontaktná osoba</Label>
          <Input id="contactName" {...form.register("contactName")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contactPhone">Telefón na kontakt</Label>
          <Input id="contactPhone" {...form.register("contactPhone")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ico">IČO (nepovinné)</Label>
          <Input id="ico" {...form.register("ico")} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Ukladáme..." : "Uložiť profil"}
      </Button>
    </form>
  );
}
