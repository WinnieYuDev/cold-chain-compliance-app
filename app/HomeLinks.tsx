"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function HomeLinks() {
  const me = useQuery(api.users.getMe);

  return (
    <div className="flex gap-3">
      {me == null && (
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          Sign in
        </Link>
      )}
      {me != null && (
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          Dashboard
        </Link>
      )}
      {me == null && (
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800"
        >
          Register company
        </Link>
      )}
      <Link
        href="/about"
        className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800"
      >
        About
      </Link>
    </div>
  );
}
