"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 max-w-full items-center justify-center rounded-full text-center text-sm font-medium leading-snug whitespace-normal break-words transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md",
        outline:
          "border border-border bg-white/80 text-foreground shadow-sm hover:border-primary hover:text-primary",
        ghost: "text-foreground hover:bg-muted/70",
      },
      size: {
        default: "min-h-[2.75rem] px-6 py-2",
        sm: "min-h-[2.25rem] px-4 py-1.5 text-xs",
        lg: "min-h-[3rem] px-7 py-2.5 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = {
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
