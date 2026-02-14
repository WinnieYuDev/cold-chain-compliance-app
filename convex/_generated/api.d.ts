/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_analysis from "../ai/analysis.js";
import type * as ai_storage from "../ai/storage.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as companies from "../companies.js";
import type * as dashboard from "../dashboard.js";
import type * as excursions_detect from "../excursions/detect.js";
import type * as export_ from "../export.js";
import type * as facilities from "../facilities.js";
import type * as http from "../http.js";
import type * as ingestion_mockApi from "../ingestion/mockApi.js";
import type * as ingestion_mutations from "../ingestion/mutations.js";
import type * as ingestion_parse from "../ingestion/parse.js";
import type * as ingestion_upload from "../ingestion/upload.js";
import type * as lib_types from "../lib/types.js";
import type * as policies_engine from "../policies/engine.js";
import type * as policies_mutations from "../policies/mutations.js";
import type * as policies_queries from "../policies/queries.js";
import type * as risk_mutations from "../risk/mutations.js";
import type * as risk_scoring from "../risk/scoring.js";
import type * as seed from "../seed.js";
import type * as shipments from "../shipments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/analysis": typeof ai_analysis;
  "ai/storage": typeof ai_storage;
  audit: typeof audit;
  auth: typeof auth;
  companies: typeof companies;
  dashboard: typeof dashboard;
  "excursions/detect": typeof excursions_detect;
  export: typeof export_;
  facilities: typeof facilities;
  http: typeof http;
  "ingestion/mockApi": typeof ingestion_mockApi;
  "ingestion/mutations": typeof ingestion_mutations;
  "ingestion/parse": typeof ingestion_parse;
  "ingestion/upload": typeof ingestion_upload;
  "lib/types": typeof lib_types;
  "policies/engine": typeof policies_engine;
  "policies/mutations": typeof policies_mutations;
  "policies/queries": typeof policies_queries;
  "risk/mutations": typeof risk_mutations;
  "risk/scoring": typeof risk_scoring;
  seed: typeof seed;
  shipments: typeof shipments;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
