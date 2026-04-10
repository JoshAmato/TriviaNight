"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 font-display text-3xl text-accent">Trivia Night</h1>
        <p className="mb-8 text-text-mid">Sign in to your host account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-surface-border bg-surface px-4 py-3 text-text outline-none transition-colors focus:border-accent"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-lg border border-surface-border bg-surface px-4 py-3 text-text outline-none transition-colors focus:border-accent"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-dim disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-mid">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
