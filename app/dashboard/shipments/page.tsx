"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ShipmentsPage() {
  const shipments = useQuery(api.shipments.listShipments, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Shipments</h1>
      <div className="rounded-xl border border-slate-600 bg-slate-800/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="text-left p-3 text-slate-400 font-medium">Shipment ID</th>
              <th className="text-left p-3 text-slate-400 font-medium">Product Type</th>
              <th className="text-left p-3 text-slate-400 font-medium">Facility</th>
            </tr>
          </thead>
          <tbody>
            {(shipments ?? []).map((s) => (
              <tr key={s._id} className="border-t border-slate-700">
                <td className="p-3 text-white">{s.shipmentId}</td>
                <td className="p-3 text-slate-300">{s.productType}</td>
                <td className="p-3 text-slate-300">{s.facilityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!shipments || shipments.length === 0) && (
          <p className="p-6 text-slate-500 text-center">No shipments. Run seed or upload data.</p>
        )}
      </div>
    </div>
  );
}
