"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KPICard } from "@/components/KPICard";
import { TemperatureChart } from "@/components/TemperatureChart";
import { AuditLogTable } from "@/components/AuditLogTable";
import { AIInsightCard } from "@/components/AIInsightCard";

type PolicyFilter = "all" | "food" | "pharma";

export default function DashboardPage() {
  const [policyType, setPolicyType] = useState<PolicyFilter>("all");

  const kpis = useQuery(
    api.dashboard.kpis,
    policyType === "all" ? {} : { policyType }
  );
  const readings = useQuery(api.dashboard.recentTemperatureReadings, {
    limit: 60,
  });
  const excursions = useQuery(api.dashboard.recentExcursions, { limit: 10 });
  const auditLogs = useQuery(api.dashboard.recentAuditLogs, { limit: 15 });
  const aiInsights = useQuery(api.dashboard.aiInsightsList, { limit: 5 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Compliance Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPolicyType("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              policyType === "all"
                ? "bg-accent text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPolicyType("food")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              policyType === "food"
                ? "bg-accent text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Food
          </button>
          <button
            onClick={() => setPolicyType("pharma")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              policyType === "pharma"
                ? "bg-accent text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Pharma
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Shipments"
          value={kpis?.totalShipments ?? "—"}
          subtitle={policyType !== "all" ? `${policyType} only` : undefined}
        />
        <KPICard
          title="Open Excursions"
          value={kpis?.openExcursions ?? "—"}
          variant={kpis?.openExcursions ? "warning" : "default"}
        />
        <KPICard
          title="High Risk"
          value={kpis?.highRiskCount ?? "—"}
          variant={kpis?.highRiskCount ? "danger" : "default"}
        />
        <KPICard
          title="Audit Events Today"
          value={kpis?.auditEventsToday ?? "—"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature trend */}
        <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Temperature (recent)
          </h2>
          {readings && readings.length > 0 ? (
            <TemperatureChart data={readings} />
          ) : (
            <p className="text-slate-500 text-sm py-8">No readings yet.</p>
          )}
        </div>

        {/* Excursion alerts */}
        <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Excursions
          </h2>
          {excursions && excursions.length > 0 ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {excursions.map((e) => (
                <li
                  key={e._id}
                  className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0"
                >
                  <span className="text-slate-300 text-sm">
                    {e.ruleViolated} · {e.durationMinutes} min
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      e.severity === "high" || e.severity === "critical"
                        ? "text-danger"
                        : "text-warning"
                    }`}
                  >
                    {e.severity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm py-4">No excursions.</p>
          )}
        </div>
      </div>

      {/* AI insights */}
      <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">
          AI Insights & Recommendations
        </h2>
        <AIInsightCard insights={aiInsights ?? []} />
      </div>

      {/* Audit log */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Audit Log</h2>
        <AuditLogTable logs={auditLogs ?? []} />
      </div>
    </div>
  );
}
