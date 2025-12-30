"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onCheckedChange?: (checked: boolean) => void;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "size-5 shrink-0 rounded border border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        onChange={(event) => {
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";
