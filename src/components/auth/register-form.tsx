"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RegisterInput } from "@/lib/validators/auth";
import { registerSchema } from "@/lib/validators/auth";
import { UserRole } from "@/types";

const roleOptions = [
  { value: UserRole.WORKER, label: "Pracovník" },
  { value: UserRole.COMPANY, label: "Firma / sklad" },
];

type RegisterFormProps = {
  initialRole?: typeof UserRole.WORKER | typeof UserRole.COMPANY | undefined;
};

export function RegisterForm({ initialRole }: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      role: initialRole ?? UserRole.WORKER,
    },
  });

  const handleSubmit = (values: RegisterInput) => {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        let data: { error?: string } | null = null;

        try {
          data = await response.json();
        } catch {
          // Response body is empty or not JSON.
        }

        setError(data?.error ?? "Registráciu sa nepodarilo dokončiť");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!signInResult?.ok) {
        setError(
          "Registráciu sa nepodarilo dokončiť. Skúste sa prihlásiť alebo použiť iný e-mail.",
        );
        return;
      }

      const target =
        values.role === UserRole.WORKER
          ? "/worker/onboarding"
          : "/company/onboarding";
      router.push(target);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6 rounded-3xl border border-border bg-card/70 p-6 shadow-sm"
    >
      <div className="space-y-1">
        <Label htmlFor="email">Pracovný e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="vy@firma.sk"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Heslo</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="role">Registrujem sa ako</Label>
        <Select id="role" {...form.register("role")}>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Vytvárame účet..." : "Vytvoriť účet"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Už máte účet?{" "}
        <Link className="font-medium text-primary hover:underline" href="/auth/login">
          Prihláste sa
        </Link>
      </p>
    </form>
  );
}
