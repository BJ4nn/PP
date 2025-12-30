"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginInput } from "@/lib/validators/auth";
import { loginSchema } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/types";

const roleDashboardMap: Record<UserRole, string> = {
  [UserRole.WORKER]: "/worker/dashboard",
  [UserRole.COMPANY]: "/company/dashboard",
  [UserRole.ADMIN]: "/admin",
};

type Props = {
  callbackUrl?: string | undefined;
};

export function LoginForm({ callbackUrl }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (values: LoginInput) => {
    startTransition(async () => {
      setError(null);
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        ...(callbackUrl ? { callbackUrl } : {}),
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Nesprávny e-mail alebo heslo");
        } else if (result.error === "RATE_LIMITED") {
          setError("Príliš veľa pokusov. Skúste to znova o chvíľu.");
        } else {
          setError(
            "Prihlásenie zlyhalo na strane servera. Skontrolujte, či beží databáza (Postgres) a API.",
          );
        }
        return;
      }

      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();
      const role: UserRole | undefined = session?.user?.role;
      const target =
        callbackUrl ??
        (role ? roleDashboardMap[role] : roleDashboardMap[UserRole.WORKER]);

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
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Prihlasujeme..." : "Prihlásiť sa"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Ešte nemáte účet?{" "}
        <Link
          className="font-medium text-primary hover:underline"
          href="/auth/register"
        >
          Registrujte sa ako pracovník alebo firma
        </Link>
      </p>
    </form>
  );
}
