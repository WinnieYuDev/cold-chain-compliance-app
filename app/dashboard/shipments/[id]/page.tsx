"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { TemperatureChart, type ExcursionBand } from "@/components/TemperatureChart";
import { AIInsightCard } from "@/components/AIInsightCard";
import { Card } from "@/components/ui/Card";
import { Badge, severityToBadgeVariant } from "@/components/ui/Badge";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";

const EXCURSION_BAND_COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#0891b2"];

function getExcursionColor(index: number): string {
  return EXCURSION_BAND_COLORS[index % EXCURSION_BAND_COLORS.length];
}

function ShipmentDetailContent({
  detail,
  chartData,
  excursionBands,
  aiInsightsWithColors,
}: {
  detail: NonNullable<ReturnType<typeof useQuery<typeof api.shipments.getShipmentDetail>>>;
  chartData: Array<{ timestamp: number; temperature: number }>;
  excursionBands: ExcursionBand[];
  aiInsightsWithColors: Array<{ _id: string; type: string; content: string; shipmentId?: unknown; accentColor?: string }>;
}) {
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

      <Card title="Key parameters tracked">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-md border border-slate-600 bg-slate-blue/50 p-4">
            <h3 className="card-header text-sm mb-1">Temperature</h3>
            <p className="text-white font-medium">
              {currentTemp != null ? `${currentTemp}°C` : "—"}
              {(minTemp != null && maxTemp != null) && (
                <span className="text-slate-400 text-sm font-normal ml-2">
                  (range {minTemp}-{maxTemp}°C)
                </span>
              )}
            </p>
            <p className="metadata mt-2">Primary metric for cold chain integrity; deviations trigger alerts.</p>
          </div>
          <div className="rounded-md border border-slate-600 bg-slate-blue/50 p-4">
            <h3 className="card-header text-sm mb-1">Humidity</h3>
            <p className="body-text">Not monitored</p>
            <p className="metadata mt-2">Crucial for some products; sensors can be added for full visibility.</p>
          </div>
          <div className="rounded-md border border-slate-600 bg-slate-blue/50 p-4">
            <h3 className="card-header text-sm mb-1">Motion / Shock</h3>
            <p className="body-text">Coming soon</p>
            <p className="metadata mt-2">Rough handling and impacts can affect product quality; monitoring planned.</p>
          </div>
          <div className="rounded-md border border-slate-600 bg-slate-blue/50 p-4">
            <h3 className="card-header text-sm mb-1">Door opening / Light</h3>
            <p className="body-text">Coming soon</p>
            <p className="metadata mt-2">Security and chain-of-custody; door and light sensors planned.</p>
          </div>
        </div>
      </Card>

      <Card title="Excursions & alerts">
        <p className="body-text mb-4">Instant alerts for deviations; listed below with severity and duration.</p>
        {excursions.length === 0 ? (
          <p className="metadata">No excursions for this shipment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>Detected</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Duration</TableHead>
            </TableHeader>
            <TableBody>
              {excursions.map((e) => (
                <TableRow key={e._id}>
                  <TableCell className="metadata whitespace-nowrap">{new Date(e.detectedAt).toLocaleString()}</TableCell>
                  <TableCell className="body-text">{e.ruleViolated}</TableCell>
                  <TableCell>
                    <Badge variant={severityToBadgeVariant(e.severity)}>{e.severity}</Badge>
                  </TableCell>
                  <TableCell className="body-text">{e.durationMinutes} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card title="Compliance">
        <p className="body-text">
          FDA/WHO-aligned monitoring. Policy: <strong className="text-white">{policyName}</strong> ({policyType}).
        </p>
      </Card>

      <Card title="Data & analytics">
        <p className="body-text">
          Data is transmitted for real-time analysis and corrective action. Insights help optimize logistics and cold chain performance.
        </p>
      </Card>

      <Card title="AI insights">
        <AIInsightCard insights={aiInsightsWithColors} />
      </Card>
    </div>
  );
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

  return (
    <ShipmentDetailContent
      detail={detail}
      chartData={chartData}
      excursionBands={excursionBands}
      aiInsightsWithColors={aiInsightsWithColors}
    />
  );
}
