"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KPICard } from "@/components/KPICard";
import { TemperatureChart, type ExcursionBand } from "@/components/TemperatureChart";
import { AuditLogTable } from "@/components/AuditLogTable";
import { AIInsightCard } from "@/components/AIInsightCard";

const EXCURSION_BAND_COLOR = "#ea580c";

export default function DashboardPage() {
  const kpis = useQuery(api.dashboard.kpis, {});
  const readings = useQuery(api.dashboard.recentTemperatureReadings, {
    limit: 60,
  });
  const mostRecent = useQuery(api.dashboard.mostRecentExcursionWithInsight);
  const auditLogs = useQuery(api.dashboard.recentAuditLogs, { limit: 15 });

  const excursionBands: ExcursionBand[] = useMemo(() => {
    const ex = mostRecent?.excursion;
    if (!ex) return [];
    return [
      {
        startTime: ex.startTime,
        endTime: ex.endTime,
        severity: ex.severity,
        color: EXCURSION_BAND_COLOR,
      },
    ];
  }, [mostRecent?.excursion]);

  const singleInsightForCard = useMemo(() => {
    const insight = mostRecent?.insight;
    if (!insight) return [];
    return [{ _id: insight._id, type: insight.type, content: insight.content, shipmentId: insight.shipmentId }];
  }, [mostRecent?.insight]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Compliance Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Shipments"
          value={kpis?.totalShipments ?? "—"}
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

      {/* Temperature log with most recent excursion and related AI insight */}
      <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">
          Temperature log (recent) — excursions highlighted
        </h2>
        {readings && readings.length > 0 ? (
          <>
            <TemperatureChart
              data={readings}
              minSafeTemp={2}
              maxSafeTemp={8}
              excursions={excursionBands}
            />
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Most recent excursion — auditing & policy compliance
              </h3>
              {mostRecent === undefined ? (
                <p className="text-slate-500 text-sm">Loading…</p>
              ) : mostRecent === null ? (
                <p className="text-slate-500 text-sm">No recent excursion.</p>
              ) : mostRecent.insight === null ? (
                <p className="text-slate-500 text-sm">No AI analysis for this excursion yet.</p>
              ) : (
                <AIInsightCard insights={singleInsightForCard} />
              )}
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-sm py-8">No readings yet.</p>
        )}
      </div>

      {/* Audit log */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Audit Log</h2>
        <AuditLogTable logs={auditLogs ?? []} />
      </div>
    </div>
  );
}
