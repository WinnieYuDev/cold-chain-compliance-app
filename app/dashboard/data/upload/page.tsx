"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [facilityId, setFacilityId] = useState<Id<"facilities"> | "">("");
  const [policyId, setPolicyId] = useState<Id<"policies"> | "">("");
  const [status, setStatus] = useState<string>("");

  const generateUploadUrl = useMutation(api.ingestion.mutations.generateUploadUrl);
  const processUpload = useAction(api.ingestion.upload.processUpload);
  const facilitiesRaw = useQuery(api.facilities.listFacilities, {});
  const policiesRaw = useQuery(api.policies.queries.listPolicies, { activeOnly: true });

  const facilities = useMemo(() => {
    const raw = facilitiesRaw ?? [];
    const byId = new Map(raw.map((f) => [f._id, f]));
    const byName = new Map<string, typeof raw[0]>();
    for (const f of byId.values()) {
      if (!byName.has(f.name)) byName.set(f.name, f);
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [facilitiesRaw]);

  const policies = useMemo(() => {
    const raw = policiesRaw ?? [];
    const byId = new Map(raw.map((p) => [p._id, p]));
    const byName = new Map<string, typeof raw[0]>();
    for (const p of byId.values()) {
      if (!byName.has(p.name)) byName.set(p.name, p);
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [policiesRaw]);

  async function handleUpload() {
    if (!file || !facilityId || !policyId) {
      setStatus("Select file, facility, and policy.");
      return;
    }
    setStatus("Uploading...");
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      const result = await processUpload({
        storageId,
        facilityId: facilityId as Id<"facilities">,
        policyId: policyId as Id<"policies">,
        format,
      });
      setStatus(result.success ? `Processed ${result.rowsProcessed} rows.` : result.message ?? "Failed");
      setFile(null);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-white">Data Upload</h1>
      <p className="text-slate-400 text-sm">
        Upload CSV or JSON temperature data. Data is normalized and excursion detection runs automatically.
      </p>

      <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "json")}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Facility</label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value as Id<"facilities">)}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
          >
            <option value="">Select facility</option>
            {facilities.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Policy</label>
          <select
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value as Id<"policies">)}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
          >
            <option value="">Select policy</option>
            {policies.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">File</label>
          <input
            type="file"
            accept={format === "csv" ? ".csv" : ".json"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 text-slate-300 px-3 py-2 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-accent file:text-white"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || !facilityId || !policyId}
          className="w-full rounded-lg bg-accent text-white py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload & Ingest
        </button>
        {status && <p className="text-sm text-slate-400">{status}</p>}
      </div>
    </div>
  );
}
