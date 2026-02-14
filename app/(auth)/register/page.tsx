"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const createCompany = useMutation(api.companies.createCompany);
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const companyId = await createCompany({ name: companyName });
      const result = await signIn("password", {
        email,
        password,
        name: adminName,
        flow: "signUp",
        companyId,
        role: "admin",
      });
      if (result?.signingIn) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-primary">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h1 className="text-xl font-semibold text-white mb-4">
          Register your company
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm text-slate-400 mb-1">
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Acme Inc"
            />
          </div>
          <div>
            <label htmlFor="adminName" className="block text-sm text-slate-400 mb-1">
              Your name
            </label>
            <input
              id="adminName"
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
              Admin email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
