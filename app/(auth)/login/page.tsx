"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b28c620f-1826-4804-86f9-e892a0cc3bef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'339547'},body:JSON.stringify({sessionId:'339547',location:'app/(auth)/login/page.tsx:pre-signIn',message:'signIn args',data:{flow:'signIn',emailLength:email?.length,hasPassword:!!password},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const result = await signIn("password", {
        email,
        password,
        flow: "signIn",
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b28c620f-1826-4804-86f9-e892a0cc3bef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'339547'},body:JSON.stringify({sessionId:'339547',location:'app/(auth)/login/page.tsx:post-signIn',message:'signIn result',data:{signingIn:!!result?.signingIn},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (result?.signingIn) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      // #region agent log
      const errMsg = err instanceof Error ? err.message : String(err);
      const causeMsg = err instanceof Error && err.cause instanceof Error ? err.cause.message : (err as { cause?: { message?: string } })?.cause?.message;
      fetch('http://127.0.0.1:7242/ingest/b28c620f-1826-4804-86f9-e892a0cc3bef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'339547'},body:JSON.stringify({sessionId:'339547',location:'app/(auth)/login/page.tsx:catch',message:'signIn error',data:{errMsg,causeMsg,name:err instanceof Error ? err.name : undefined},timestamp:Date.now(),hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      let message =
        err instanceof ConvexError
          ? (typeof err.data === "string" ? err.data : (err.data as { message?: string })?.message ?? "Sign in failed")
          : err instanceof Error
            ? err.message
            : "Sign in failed";
      if (message.includes("Server Error")) {
        message =
          "Sign-in failed (server error). Set JWT_PRIVATE_KEY and JWKS in your Convex dashboard (Convex Auth manual) and redeploy.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-primary">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h1 className="text-xl font-semibold text-white mb-4">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="you@example.com"
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
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </main>
  );
}
