"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (response?.error) {
      setError("Invalid credentials.");
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card className="space-y-6">
        <CardHeader>
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>Secure access to the Wymap workforce console.</CardDescription>
        </CardHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>
      </Card>
      <div className="surface space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Admin Access
          </p>
          <h1 className="text-3xl font-semibold">Sign in</h1>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            Email
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Password
            <input
              className="rounded-lg border border-[var(--surface-border)] bg-transparent px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            className="w-full rounded-lg bg-[var(--violet-1)]/60 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
