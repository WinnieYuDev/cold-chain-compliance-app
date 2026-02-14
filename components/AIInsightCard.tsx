"use client";

interface Insight {
  _id: string;
  type: string;
  content: string;
  shipmentId?: string;
  /** Optional border color to match an excursion band on the chart */
  accentColor?: string;
}

interface AIInsightCardProps {
  insights: (Insight & { accentColor?: string })[];
}

export function AIInsightCard({ insights }: AIInsightCardProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4 text-slate-500 text-sm">
        No AI insights yet.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {insights.map((i) => (
        <div
          key={i._id}
          className="rounded-xl border border-slate-600 bg-slate-800/30 p-4 text-sm"
          style={
            i.accentColor
              ? { borderLeftWidth: "4px", borderLeftColor: i.accentColor }
              : undefined
          }
        >
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={i.accentColor ? { color: i.accentColor } : { color: "var(--accent, #2563eb)" }}
          >
            {i.type.replace(/_/g, " ")}
          </span>
          <p className="mt-2 text-slate-300">{i.content}</p>
        </div>
      ))}
    </div>
  );
}
