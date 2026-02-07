/**
 * Export audit logs as CSV for regulatory submission.
 */
import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

type AuditLogExportRow = {
  timestamp: number;
  eventType: string;
  ruleViolated?: string;
  severity?: string;
  correctiveAction?: string;
  aiExplanation?: string;
};

/** Internal: get audit logs in date range */
export const getAuditLogsForExport = internalQuery({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.array(
    v.object({
      timestamp: v.number(),
      eventType: v.string(),
      ruleViolated: v.optional(v.string()),
      severity: v.optional(v.string()),
      correctiveAction: v.optional(v.string()),
      aiExplanation: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const all = await ctx.db.query("auditLogs").collect();
    return all
      .filter((a) => a.timestamp >= args.startTime && a.timestamp <= args.endTime)
      .map((a) => ({
        timestamp: a.timestamp,
        eventType: a.eventType,
        ruleViolated: a.ruleViolated,
        severity: a.severity,
        correctiveAction: a.correctiveAction,
        aiExplanation: a.aiExplanation,
      }));
  },
});

/** Export audit logs as CSV string (for download) */
export const exportAuditLogsCSV = action({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const logs: AuditLogExportRow[] = await ctx.runQuery(
      internal.export.getAuditLogsForExport,
      {
        startTime: args.startTime,
        endTime: args.endTime,
      }
    );
    const header = "Timestamp,Event Type,Rule Violated,Severity,Corrective Action,AI Explanation\n";
    const rows: string[] = logs.map((l: AuditLogExportRow) =>
      `${new Date(l.timestamp).toISOString()},"${(l.eventType ?? "").replace(/"/g, '""')}","${(l.ruleViolated ?? "").replace(/"/g, '""')}","${(l.severity ?? "").replace(/"/g, '""')}","${(l.correctiveAction ?? "").replace(/"/g, '""')}","${(l.aiExplanation ?? "").replace(/"/g, '""')}"\n`
    );
    return header + rows.join("");
  },
});
