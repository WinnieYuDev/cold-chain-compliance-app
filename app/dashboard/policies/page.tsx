"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PoliciesPage() {
  const policies = useQuery(api.policies.queries.listPolicies, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Policies</h1>
      <p className="text-slate-400 text-sm">
        Central policy config: Food (HACCP/FSMA) and Pharma (GDP/GxP). Admin can create and edit.
      </p>
      <div className="grid gap-4">
        {(policies ?? []).map((p) => (
          <div
            key={p._id}
            className="rounded-xl border border-slate-600 bg-slate-800/30 p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{p.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${p.type === "food" ? "bg-amber-900/50 text-amber-300" : "bg-blue-900/50 text-blue-300"}`}>
                {p.type}
              </span>
            </div>
            <pre className="mt-2 text-xs text-slate-400 overflow-x-auto">
              {JSON.stringify(p.rules, null, 2)}
            </pre>
            <p className="mt-2 text-xs text-slate-500">
              Updated {new Date(p.updatedAt).toLocaleString()} · Active: {p.active ? "Yes" : "No"}
            </p>
          </div>
        ))}
        {(!policies || policies.length === 0) && (
          <p className="text-slate-500 p-6 text-center">No policies. Run seed first.</p>
        )}
      </div>
    </div>
  );
}
