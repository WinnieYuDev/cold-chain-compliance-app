"use client";

interface LogEntry {
  _id: string;
  timestamp: number;
  eventType: string;
  ruleViolated?: string;
  severity?: string;
  aiExplanation?: string;
}

interface AuditLogTableProps {
  logs: LogEntry[];
}

function severityColor(s: string | undefined) {
  if (!s) return "text-slate-400";
  switch (s) {
    case "critical": return "text-danger";
    case "high": return "text-danger";
    case "medium": return "text-warning";
    default: return "text-slate-400";
  }
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/30 overflow-hidden">
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 sticky top-0">
            <tr>
              <th className="text-left p-3 text-slate-400 font-medium">Time</th>
              <th className="text-left p-3 text-slate-400 font-medium">Event</th>
              <th className="text-left p-3 text-slate-400 font-medium">Severity</th>
              <th className="text-left p-3 text-slate-400 font-medium">Explanation</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-t border-slate-700 hover:bg-slate-800/50">
                <td className="p-3 text-slate-300 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-3 text-slate-300">
                  {log.eventType}
                  {log.ruleViolated && (
                    <span className="text-slate-500 ml-1">({log.ruleViolated})</span>
                  )}
                </td>
                <td className={`p-3 font-medium ${severityColor(log.severity)}`}>
                  {log.severity ?? "—"}
                </td>
                <td className="p-3 text-slate-400 max-w-xs truncate">
                  {log.aiExplanation ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
