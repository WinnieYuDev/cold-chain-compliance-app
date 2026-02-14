"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KPICard } from "@/components/KPICard";
import { TemperatureChart, type ExcursionBand } from "@/components/TemperatureChart";
import { AuditLogTable } from "@/components/AuditLogTable";
import { AIInsightCard } from "@/components/AIInsightCard";
import type { Id } from "@/convex/_generated/dataModel";

const EXCURSION_BAND_COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#0891b2"];

function getExcursionColor(index: number): string {
  return EXCURSION_BAND_COLORS[index % EXCURSION_BAND_COLORS.length];
}

export default function DashboardPage() {
  const kpis = useQuery(api.dashboard.kpis, {});
  const readings = useQuery(api.dashboard.recentTemperatureReadings, {
    limit: 60,
  });
  const excursions = useQuery(api.dashboard.recentExcursions, { limit: 10 });
  const auditLogs = useQuery(api.dashboard.recentAuditLogs, { limit: 15 });
  const aiInsightsRaw = useQuery(api.dashboard.aiInsightsList, { limit: 10 });

  const excursionBands: ExcursionBand[] = useMemo(
    () =>
      (excursions ?? []).map((e, i) => ({
        startTime: e.startTime,
        endTime: e.endTime,
        severity: e.severity,
        color: getExcursionColor(i),
      })),
    [excursions]
  );

  const excursionInsightsWithColors = useMemo(() => {
    const insights = (aiInsightsRaw ?? []).filter((i) => i.type === "excursion_analysis");
    const ex = excursions ?? [];
    return insights.map((insight) => {
      const shipmentId = insight.shipmentId as Id<"shipments"> | undefined;
      const excursionIndex = shipmentId
        ? ex.findIndex((e) => e.shipmentId === shipmentId)
        : -1;
      const accentColor = excursionIndex >= 0 ? getExcursionColor(excursionIndex) : undefined;
      return { ...insight, accentColor };
    });
  }, [aiInsightsRaw, excursions]);

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

      {/* Temperature log with excursions on chart and AI insights below (color-matched) */}
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
                AI insights (excursion analysis) — color matches chart
              </h3>
              <AIInsightCard insights={excursionInsightsWithColors} />
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
