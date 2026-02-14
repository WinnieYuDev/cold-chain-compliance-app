"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface Point {
  timestamp: number;
  temperature: number;
  time: string;
}

export interface ExcursionBand {
  startTime: number;
  endTime?: number;
  severity?: string;
  /** Optional fill color for the band (e.g. to match AI insight card) */
  color?: string;
}

interface TemperatureChartProps {
  data: Array<{ timestamp: number; temperature: number }>;
  height?: number;
  /** Cold chain lower bound (°C); below = severe. Default 2. */
  minSafeTemp?: number;
  /** Cold chain upper bound (°C); above = severe. Default 8. */
  maxSafeTemp?: number;
  /** Excursions to show as vertical bands on the chart */
  excursions?: ExcursionBand[];
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function isSevere(temp: number, minSafe: number, maxSafe: number) {
  return temp < minSafe || temp > maxSafe;
}


export function TemperatureChart({
  data,
  height = 280,
  minSafeTemp = 2,
  maxSafeTemp = 8,
  excursions = [],
}: TemperatureChartProps) {
  const points: Point[] = [...data]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((r) => ({
      timestamp: r.timestamp,
      temperature: r.temperature,
      time: formatTime(r.timestamp),
    }));

  const dataMin = points.length ? Math.min(...points.map((p) => p.timestamp)) : 0;
  const dataMax = points.length ? Math.max(...points.map((p) => p.timestamp)) : 1;
  const excursionTimes = excursions.flatMap((e) => [e.startTime, e.endTime ?? e.startTime]);
  const xMin = excursionTimes.length
    ? Math.min(dataMin, ...excursionTimes)
    : dataMin;
  const xMax = excursionTimes.length
    ? Math.max(dataMax, ...excursionTimes)
    : dataMax;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={[xMin, xMax]}
          stroke="#94a3b8"
          fontSize={11}
          tickFormatter={(ts) => formatTime(ts)}
        />
        <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
          labelFormatter={(ts) => (typeof ts === "number" ? new Date(ts).toLocaleString() : String(ts))}
          formatter={(value: number) => {
            const severe = isSevere(value, minSafeTemp, maxSafeTemp);
            return [`${value}°C${severe ? " (out of range)" : ""}`, "Temperature"];
          }}
        />
        <ReferenceArea y1={maxSafeTemp} y2={50} fill="#dc2626" fillOpacity={0.15} />
        <ReferenceArea y1={-50} y2={minSafeTemp} fill="#dc2626" fillOpacity={0.15} />
        {excursions.map((e, i) => {
          const end = e.endTime ?? e.startTime + 60 * 60 * 1000;
          const fill = e.color ?? "#ea580c";
          return (
            <ReferenceArea
              key={i}
              x1={e.startTime}
              x2={end}
              fill={fill}
              fillOpacity={0.25}
            />
          );
        })}
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#2563EB"
          strokeWidth={2}
          dot={({ cx, cy, payload }) => {
            const severe = isSevere(payload.temperature, minSafeTemp, maxSafeTemp);
            return severe ? (
              <circle cx={cx} cy={cy} r={3} fill="#dc2626" stroke="#1e293b" strokeWidth={1} />
            ) : null;
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
