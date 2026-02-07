/**
 * Parse and normalize CSV/JSON ingestion data.
 * Normalizes: timestamp to ms, shipmentId and productType to canonical strings.
 */

export type NormalizedRow = {
  shipmentId: string;
  timestamp: number;
  temperature: number;
  productType: string;
  facilityId?: string;
  source: string;
};

/**
 * Parse CSV text into rows. Expects headers: shipment_id or shipmentId, timestamp or time, temperature or temp_c, product_type or productType, facility_id (optional).
 */
export function parseCSV(text: string, source: string): NormalizedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: NormalizedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const record: Record<string, string> = {};
    header.forEach((h, j) => {
      record[h] = values[j] ?? "";
    });
    const shipmentId = (record.shipment_id ?? record.shipmentid ?? record.shipment_id ?? "").trim() || (record.shipmentid ?? "").trim();
    const tsRaw = record.timestamp ?? record.time ?? record.datetime ?? "";
    const tempRaw = record.temperature ?? record.temp_c ?? record.temp ?? "";
    const productType = (record.product_type ?? record.producttype ?? record.product ?? "unknown").trim();
    const facilityId = (record.facility_id ?? record.facilityid ?? "").trim() || undefined;
    if (!shipmentId || !tsRaw || tempRaw === "") continue;
    const timestamp = normalizeTimestamp(tsRaw);
    const temperature = parseFloat(tempRaw);
    if (Number.isNaN(temperature)) continue;
    rows.push({
      shipmentId: shipmentId.toUpperCase(),
      timestamp,
      temperature,
      productType: productType || "unknown",
      facilityId,
      source,
    });
  }
  return rows;
}

/**
 * Parse JSON array. Each item: shipmentId/shipment_id, timestamp/time, temperature/tempC/temp_c, productType/product_type, facilityId (optional).
 */
export function parseJSON(data: unknown, source: string): NormalizedRow[] {
  const arr = Array.isArray(data) ? data : [data];
  const rows: NormalizedRow[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const shipmentId = String(obj.shipmentId ?? obj.shipment_id ?? "").trim();
    const tsRaw = obj.timestamp ?? obj.time ?? obj.datetime;
    const temp = obj.temperature ?? obj.tempC ?? obj.temp_c ?? obj.temp;
    const productType = String(obj.productType ?? obj.product_type ?? obj.product ?? "unknown").trim();
    const facilityId = obj.facilityId ?? obj.facility_id;
    if (!shipmentId || (tsRaw === undefined && tsRaw === null)) continue;
    const timestamp = typeof tsRaw === "number" ? (tsRaw < 1e12 ? tsRaw * 1000 : tsRaw) : normalizeTimestamp(String(tsRaw));
    const temperature = typeof temp === "number" ? temp : parseFloat(String(temp));
    if (Number.isNaN(temperature)) continue;
    rows.push({
      shipmentId: shipmentId.toUpperCase(),
      timestamp,
      temperature,
      productType: productType || "unknown",
      facilityId: facilityId != null ? String(facilityId) : undefined,
      source,
    });
  }
  return rows;
}

function normalizeTimestamp(ts: string): number {
  const parsed = Date.parse(ts);
  if (!Number.isNaN(parsed)) return parsed;
  const num = parseInt(ts, 10);
  if (!Number.isNaN(num)) return num < 1e12 ? num * 1000 : num;
  return Date.now();
}
