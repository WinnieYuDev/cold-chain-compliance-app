"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { TemperatureChart, type ExcursionBand } from "@/components/TemperatureChart";
import { AIInsightCard } from "@/components/AIInsightCard";

const EXCURSION_BAND_COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#0891b2"];

function getExcursionColor(index: number): string {
  return EXCURSION_BAND_COLORS[index % EXCURSION_BAND_COLORS.length];
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const shipmentId = id as Id<"shipments"> | undefined;

  const detail = useQuery(
    api.shipments.getShipmentDetail,
    shipmentId ? { shipmentId } : "skip"
  );

  const chartData = useMemo(
    () =>
      (detail?.readings ?? [])
        .map((r) => ({ timestamp: r.timestamp, temperature: r.temperature }))
        .sort((a, b) => a.timestamp - b.timestamp),
    [detail?.readings]
  );

  const excursionBands: ExcursionBand[] = useMemo(
    () =>
      (detail?.excursions ?? []).map((e, i) => ({
        startTime: e.startTime,
        endTime: e.endTime,
        severity: e.severity,
        color: getExcursionColor(i),
      })),
    [detail?.excursions]
  );

  const aiInsightsWithColors = useMemo(() => {
    const ex = detail?.excursions ?? [];
    return (detail?.aiInsights ?? []).map((insight, i) => ({
      _id: insight._id,
      type: insight.type,
      content: insight.content,
      shipmentId: insight.shipmentId,
      accentColor: ex[i] ? getExcursionColor(i) : undefined,
    }));
  }, [detail?.aiInsights, detail?.excursions]);

  if (id === undefined) {
    return (
      <div className="space-y-6">
        <p className="text-slate-400">Invalid shipment.</p>
        <Link href="/dashboard/shipments" className="text-blue-400 hover:underline">
          ← Back to Shipments
        </Link>
      </div>
    );
  }

  if (detail === undefined) {
    return (
      <div className="space-y-6">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="space-y-6">
        <p className="text-slate-400">Shipment not found.</p>
        <Link href="/dashboard/shipments" className="text-blue-400 hover:underline">
          ← Back to Shipments
        </Link>
      </div>
    );
  }

  const { shipment, facilityName, policyName, policyType, readings, excursions, riskScore } = detail;
  const tempValues = readings.map((r) => r.temperature);
  const currentTemp = tempValues[0] ?? null;
  const minTemp = tempValues.length ? Math.min(...tempValues) : null;
  const maxTemp = tempValues.length ? Math.max(...tempValues) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/shipments"
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Shipments
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Shipment {shipment.shipmentId}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Product type</span>
            <p className="text-white font-medium">{shipment.productType}</p>
          </div>
          <div>
            <span className="text-slate-500">Facility</span>
            <p className="text-white font-medium">{facilityName}</p>
          </div>
          <div>
            <span className="text-slate-500">Policy</span>
            <p className="text-white font-medium">{policyName}</p>
          </div>
          <div>
            <span className="text-slate-500">Policy type</span>
            <p className="text-white font-medium capitalize">{policyType}</p>
          </div>
        </div>
        {riskScore && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <span className="text-slate-500 text-sm">Risk score</span>
            <p className="text-white font-medium capitalize">{riskScore.score}</p>
            {riskScore.aiSummary && (
              <p className="text-slate-400 text-sm mt-1">{riskScore.aiSummary}</p>
            )}
          </div>
        )}
      </div>

      {/* Temperature chart */}
      <section className="rounded-xl border border-slate-600 bg-slate-800/30 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Temperature over time</h2>
        <TemperatureChart
          data={chartData}
          height={300}
          excursions={excursionBands}
        />
      </section>

      {/* Key parameters tracked */}
      <section className="rounded-xl border border-slate-600 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Key parameters tracked</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-1">Temperature</h3>
            <p className="text-white font-medium">
              {currentTemp != null ? `${currentTemp}°C` : "—"}
              {(minTemp != null && maxTemp != null) && (
                <span className="text-slate-400 text-sm font-normal ml-2">
                  (range {minTemp}–{maxTemp}°C)
                </span>
              )}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Primary metric for cold chain integrity; deviations trigger alerts.
            </p>
          </div>
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-1">Humidity</h3>
            <p className="text-slate-400">Not monitored</p>
            <p className="text-slate-500 text-xs mt-2">
              Crucial for some products; sensors can be added for full visibility.
            </p>
          </div>
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-1">Motion / Shock</h3>
            <p className="text-slate-400">Coming soon</p>
            <p className="text-slate-500 text-xs mt-2">
              Rough handling and impacts can affect product quality; monitoring planned.
            </p>
          </div>
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-1">Door opening / Light</h3>
            <p className="text-slate-400">Coming soon</p>
            <p className="text-slate-500 text-xs mt-2">
              Security and chain-of-custody; door and light sensors planned.
            </p>
          </div>
        </div>
      </section>

      {/* Excursions & alerts */}
      <section className="rounded-xl border border-slate-600 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Excursions & alerts</h2>
        <p className="text-slate-400 text-sm mb-4">
          Instant alerts for deviations; listed below with severity and duration.
        </p>
        {excursions.length === 0 ? (
          <p className="text-slate-500 text-sm">No excursions for this shipment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-600">
                  <th className="pb-2 pr-4">Detected</th>
                  <th className="pb-2 pr-4">Rule</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {excursions.map((e) => (
                  <tr key={e._id} className="border-b border-slate-700/50">
                    <td className="py-2 pr-4 text-slate-300">
                      {new Date(e.detectedAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-slate-300">{e.ruleViolated}</td>
                    <td className="py-2 pr-4 capitalize text-slate-300">{e.severity}</td>
                    <td className="py-2 text-slate-300">{e.durationMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Compliance */}
      <section className="rounded-xl border border-slate-600 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Compliance</h2>
        <p className="text-slate-300 text-sm">
          FDA/WHO-aligned monitoring. Policy: <strong className="text-white">{policyName}</strong> ({policyType}).
        </p>
      </section>

      {/* Data & analytics */}
      <section className="rounded-xl border border-slate-600 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Data & analytics</h2>
        <p className="text-slate-300 text-sm">
          Data is transmitted for real-time analysis and corrective action. Insights help optimize logistics and cold chain performance.
        </p>
      </section>

      {/* AI insights */}
      <section className="rounded-xl border border-slate-600 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">AI insights</h2>
        <AIInsightCard insights={aiInsightsWithColors} />
      </section>
    </div>
  );
}
