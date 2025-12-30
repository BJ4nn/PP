"use client";

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  noticeLabels,
  noticeOptions,
} from "@/components/company/job-form-constants";
import type { JobFormValues } from "@/components/company/job-form";

type Props = {
  form: UseFormReturn<JobFormValues>;
};

export function JobFlexFields({ form }: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="noticeWindow">Garancia storna (notice)</Label>
          <Select id="noticeWindow" {...form.register("noticeWindow")}>
            {noticeOptions.map((value) => (
              <option key={value} value={value}>
                {noticeLabels[value]}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Vyšší notice znamená väčšiu garanciu pre pracovníka.
          </p>
        </div>
      </div>
    </div>
  );
}
