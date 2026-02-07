"use client";

interface Insight {
  _id: string;
  type: string;
  content: string;
  shipmentId?: string;
}

interface AIInsightCardProps {
  insights: Insight[];
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
          className="rounded-xl border border-accent/30 bg-slate-800/30 p-4 text-sm"
        >
          <span className="text-xs font-medium text-accent uppercase tracking-wide">
            {i.type.replace(/_/g, " ")}
          </span>
          <p className="mt-2 text-slate-300">{i.content}</p>
        </div>
      ))}
    </div>
  );
}
