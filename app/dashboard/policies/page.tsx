"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const DEFAULT_RULES = { minTemp: 2, maxTemp: 8, maxDurationMinutes: 15, repeatedViolationCount: 3 };

export default function PoliciesPage() {
  const me = useQuery(api.users.getMe);
  const policies = useQuery(api.policies.queries.listPolicies, {});
  const createPolicy = useMutation(api.policies.mutations.createPolicy);
  const updatePolicy = useMutation(api.policies.mutations.updatePolicy);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<Id<"policies"> | null>(null);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"food" | "pharma">("food");
  const [createActive, setCreateActive] = useState(true);
  const [createRulesText, setCreateRulesText] = useState(JSON.stringify(DEFAULT_RULES, null, 2));
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editRulesText, setEditRulesText] = useState("");
  const [status, setStatus] = useState("");

  const isAdmin = me?.role === "admin";

  async function handleCreate() {
    setStatus("");
    let rules: unknown;
    try {
      rules = JSON.parse(createRulesText);
    } catch {
      setStatus("Invalid JSON in rules.");
      return;
    }
    try {
      await createPolicy({
        name: createName.trim() || "New policy",
        type: createType,
        rules,
        active: createActive,
      });
      setShowCreate(false);
      setCreateName("");
      setCreateRulesText(JSON.stringify(DEFAULT_RULES, null, 2));
      setStatus("Policy created.");
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  function startEdit(p: { _id: Id<"policies">; name: string; active: boolean; rules: unknown }) {
    setEditingId(p._id);
    setEditName(p.name);
    setEditActive(p.active);
    setEditRulesText(JSON.stringify(p.rules, null, 2));
    setStatus("");
  }

  async function handleUpdate() {
    if (!editingId) return;
    setStatus("");
    let rules: unknown;
    try {
      rules = JSON.parse(editRulesText);
    } catch {
      setStatus("Invalid JSON in rules.");
      return;
    }
    try {
      await updatePolicy({
        policyId: editingId,
        name: editName.trim(),
        rules,
        active: editActive,
      });
      setEditingId(null);
      setStatus("Policy updated.");
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Policies</h1>
          <p className="text-slate-400 text-sm mt-1">
            Central policy config: Food (HACCP/FSMA) and Pharma (GDP/GxP). Admin can create and edit.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-accent text-white px-4 py-2 font-medium hover:opacity-90"
          >
            Create policy
          </button>
        )}
      </div>

      {status && (
        <p className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-slate-400"}`}>
          {status}
        </p>
      )}

      {showCreate && isAdmin && (
        <div className="rounded-xl border border-slate-600 bg-slate-800/30 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">New policy</h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
              placeholder="e.g. HACCP Cold Chain"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as "food" | "pharma")}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
            >
              <option value="food">food</option>
              <option value="pharma">pharma</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-active"
              checked={createActive}
              onChange={(e) => setCreateActive(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-accent"
            />
            <label htmlFor="create-active" className="text-slate-300 text-sm">Active</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rules (JSON)</label>
            <textarea
              value={createRulesText}
              onChange={(e) => setCreateRulesText(e.target.value)}
              rows={6}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2 font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="rounded-lg bg-accent text-white px-4 py-2 font-medium"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg bg-slate-600 text-white px-4 py-2 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {(policies ?? []).map((p) => (
          <div
            key={p._id}
            className="rounded-xl border border-slate-600 bg-slate-800/30 p-4"
          >
            {editingId === p._id && isAdmin ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-accent"
                  />
                  <label htmlFor="edit-active" className="text-slate-300 text-sm">Active</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Rules (JSON)</label>
                  <textarea
                    value={editRulesText}
                    onChange={(e) => setEditRulesText(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="rounded-lg bg-accent text-white px-4 py-2 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-slate-600 text-white px-4 py-2 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${p.type === "food" ? "bg-amber-900/50 text-amber-300" : "bg-blue-900/50 text-blue-300"}`}
                    >
                      {p.type}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => startEdit(p)}
                        className="text-sm text-accent hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <pre className="mt-2 text-xs text-slate-400 overflow-x-auto">
                  {JSON.stringify(p.rules, null, 2)}
                </pre>
                <p className="mt-2 text-xs text-slate-500">
                  Updated {new Date(p.updatedAt).toLocaleString()} · Active: {p.active ? "Yes" : "No"}
                </p>
              </>
            )}
          </div>
        ))}
        {(!policies || policies.length === 0) && !showCreate && (
          <p className="text-slate-500 p-6 text-center">No policies. Run seed or create one.</p>
        )}
      </div>
    </div>
  );
}
