"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, Suspense } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const requested = searchParams.get("next") || "/admin";
    return requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/admin";
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!username || !password || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(json?.error || "Login failed");
        }

        router.push(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, next, password, router, username],
  );

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/45 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6 dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />

        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.22em] uppercase">
              message checker
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Admin login
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to review visitor chat logs.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label
              htmlFor="admin-username"
              className="text-muted-foreground px-1 text-xs"
            >
              Username
            </Label>
            <div className="relative">
              <UserRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="admin-username"
                className="bg-background/70 h-11 rounded-xl pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="admin-password"
              className="text-muted-foreground px-1 text-xs"
            >
              Password
            </Label>
            <div className="relative">
              <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="admin-password"
                className="bg-background/70 h-11 rounded-xl pr-11 pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-11 rounded-xl"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? "Signing in..." : "Sign in"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  );
}
