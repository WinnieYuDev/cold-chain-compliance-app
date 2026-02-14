"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AboutHeader() {
  const me = useQuery(api.users.getMe);

  return (
    <header className="border-b border-slate-700 bg-slate-900/50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <Image src="/logo.svg" alt="" width={36} height={36} />
          ThermoGuard
        </Link>
        <nav className="flex gap-4">
          <Link href="/" className="text-slate-400 hover:text-white text-sm">
            Home
          </Link>
          {me == null && (
            <Link href="/login" className="text-slate-400 hover:text-white text-sm">
              Sign in
            </Link>
          )}
          {me != null && (
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
