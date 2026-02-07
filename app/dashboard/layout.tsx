"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/shipments", label: "Shipments" },
  { href: "/dashboard/excursions", label: "Excursions" },
  { href: "/dashboard/audit", label: "Audit Log" },
  { href: "/dashboard/policies", label: "Policies", adminOnly: true },
  { href: "/dashboard/data/upload", label: "Data Upload", supervisorOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-primary flex">
      <aside className="w-56 border-r border-slate-700 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link href="/dashboard" className="font-semibold text-white">
            Cold Chain Monitor
          </Link>
        </div>
        <nav className="p-2 flex-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                pathname === item.href
                  ? "bg-accent text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
