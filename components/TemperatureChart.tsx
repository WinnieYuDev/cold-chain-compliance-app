"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Point {
  timestamp: number;
  temperature: number;
  time: string;
}

interface TemperatureChartProps {
  data: Array<{ timestamp: number; temperature: number }>;
  height?: number;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function TemperatureChart({ data, height = 280 }: TemperatureChartProps) {
  const points: Point[] = [...data]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((r) => ({
      timestamp: r.timestamp,
      temperature: r.temperature,
      time: formatTime(r.timestamp),
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
        <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.timestamp
              ? new Date(payload[0].payload.timestamp).toLocaleString()
              : ""
          }
          formatter={(value: number) => [`${value}°C`, "Temperature"]}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
