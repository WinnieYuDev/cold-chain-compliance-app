"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ExcursionsPage() {
  const excursions = useQuery(api.dashboard.recentExcursions, { limit: 50 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Excursions</h1>
      <div className="rounded-xl border border-slate-600 bg-slate-800/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="text-left p-3 text-slate-400 font-medium">Shipment</th>
              <th className="text-left p-3 text-slate-400 font-medium">Rule</th>
              <th className="text-left p-3 text-slate-400 font-medium">Severity</th>
              <th className="text-left p-3 text-slate-400 font-medium">Duration (min)</th>
              <th className="text-left p-3 text-slate-400 font-medium">Detected</th>
            </tr>
          </thead>
          <tbody>
            {(excursions ?? []).map((e) => (
              <tr key={e._id} className="border-t border-slate-700">
                <td className="p-3 text-slate-300">{e.shipmentId}</td>
                <td className="p-3 text-slate-300">{e.ruleViolated}</td>
                <td className={`p-3 font-medium ${e.severity === "high" || e.severity === "critical" ? "text-danger" : "text-warning"}`}>
                  {e.severity}
                </td>
                <td className="p-3 text-slate-300">{e.durationMinutes}</td>
                <td className="p-3 text-slate-400">{new Date(e.detectedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!excursions || excursions.length === 0) && (
          <p className="p-6 text-slate-500 text-center">No excursions.</p>
        )}
      </div>
    </div>
  );
}
