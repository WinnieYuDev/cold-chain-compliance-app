# Cold Chain Compliance Monitor

Enterprise-grade cold chain compliance for **Food** and **Pharmaceutical** industries. The app ingests IoT temperature data, detects excursions, scores risk, maintains an append-only audit log, and provides AI-driven insights—with a single source of truth and role-based dashboards.

## Features

- **Data ingestion & normalization**: Upload CSV/JSON or use mock API; timestamps and identifiers are normalized and consolidated into one source of truth.
- **Policy engine**: Centralized, configurable policies—**Food** (HACCP/FSMA-style) and **Pharma** (GDP/GxP-style)—with threshold, duration, and repeated-violation rules.
- **Excursion detection**: Threshold, duration-based, and repeated minor violations; idempotent detection after each ingestion.
- **Risk scoring**: Low/Medium/High (and 0–100) with factors (e.g. duration, repeated violations); persisted per shipment.
- **Audit logging**: Append-only audit log with optional AI-generated, regulator-friendly explanations; export to CSV for submission.
- **AI**: OpenAI-powered excursion analysis, audit log explanations, and policy recommendations (set `OPENAI_API_KEY` in Convex).
- **RBAC**: Roles—Admin, Supervisor, Viewer—with role-aware UI (policies and data upload gated in UI).
- **Dashboard**: KPIs, temperature charts, excursion alerts, AI insight cards, policy selector (Food | Pharma), audit log viewer.

## Tech stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Recharts
- **Backend / DB**: Convex (queries, mutations, actions, file storage)
- **AI**: OpenAI API (Convex actions)
- **Theme**: Primary `#0F172A`, Accent `#2563EB`, Warning `#F59E0B`, Danger `#DC2626`, Success `#16A34A`

## Data sources and consolidation

- **Single source of truth**: All temperature and shipment data lives in Convex tables `temperatureReadings` and `shipments`. There is no separate “raw” table; ingestion only inserts/updates these.
- **Normalization**: CSV/JSON uploads are parsed and normalized (timestamp to ms, `shipmentId` and `productType` to canonical strings). Multiple files or API pulls for the same shipment merge into the same shipment and readings.
- **Mock data**: Use the Data Upload page with facility and policy selected, or run the seed (see below). Sample files are in `data/mock/` (`food_shipments.csv`, `pharma_readings.json`).

## Food vs Pharma policy logic

- **Food (HACCP/FSMA-style)**  
  - Cold chain: 2–8°C (configurable); frozen: e.g. &lt; -18°C.  
  - Max time out of range (e.g. 30 min) and repeated short spikes (e.g. 3) trigger violations.  
  - Severity and corrective actions are aligned with spoilage/pathogen risk framing.

- **Pharma (GDP/GxP-style)**  
  - Typically 2–8°C with stricter duration (e.g. 15 min) and lower tolerance for repeated minor excursions (e.g. 2).  
  - Severity and AI text use potency/stability and regulatory (GDP/GxP) language.

Policies are stored in the `policies` table with a `rules` JSON object (e.g. `minTempC`, `maxTempC`, `maxDurationMinutes`, `repeatedMinorCount`, `frozenMaxTempC` for food). The policy engine in `convex/policies/engine.ts` is pure logic and evaluates readings against these rules.

## Regulatory context (background)

- **HACCP / FSMA**: Hazard analysis and preventive controls; temperature controls and monitoring are part of the cold chain controls.
- **GDP / GxP**: Good Distribution Practice and related GxP expectations; cold chain must be documented and deviations investigated; potency and stability are in scope.

The app does not implement full HACCP/GDP procedures; it supports monitoring, excursion detection, risk scoring, and audit-style logging that can feed into those processes.

## AI components

- **Excursion analysis**: For each detected excursion, an optional AI action can generate a short, regulator-friendly explanation and recommended corrective action (stored in `aiInsights` or used in audit text).
- **Audit log explanation**: When new audit log entries are created, an optional action generates an `aiExplanation` and patches the log entry.
- **Policy recommendation**: A dashboard-triggered action can analyze recent excursion patterns and suggest policy tweaks (e.g. tighten duration); result is stored in `aiInsights`.

All AI calls use OpenAI (API key in Convex env); prompts are kept concise and professional for audit/regulatory readability.

## Enterprise automation and observability

- **Flow**: Ingestion → normalization → policy evaluation → excursion detection → risk scoring → (optional) AI analysis → audit log. Each step is implemented in Convex (mutations/actions) and triggered automatically after upload or mock ingest.
- **Audit log**: Append-only; all events (e.g. excursion_detected, data_ingestion) go through a single `createAuditLog` mutation. Export to CSV is available from the Audit page.
- **Observability**: Dashboard KPIs (shipments, open excursions, high-risk count, audit events today) and audit log viewer give a clear view of compliance and system use.

## Run the app locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Convex (required for backend and env)**
   In a terminal, run:
   ```bash
   npx convex dev
   ```
   - Sign in or create a Convex account if prompted.
   - Choose **create a new project** or use an existing one.
   - This writes `NEXT_PUBLIC_CONVEX_URL` (and optional `CONVEX_DEPLOYMENT`) to `.env.local` and generates `convex/_generated/`. Keep this terminal running (or run it once so codegen runs, then you can stop it if using a cloud deployment).

3. **Seed the database (once)**
   In another terminal:
   ```bash
   npx convex run seed:run
   ```
   This creates facilities, policies, users, sample shipments, readings, excursions, risk scores, audit logs, and AI insights.

4. **Start the app (Convex + Next.js)**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Go to **Dashboard**. If you see “Backend not connected”, ensure step 2 ran and `.env.local` exists, then restart `npm run dev`.

5. **Optional**
   - In the [Convex dashboard](https://dashboard.convex.dev), set `OPENAI_API_KEY` for AI features.
   - Use **Data Upload** with files from `data/mock/` (pick a facility and policy first).

## Deploy to the cloud (Convex Cloud + Vercel)

Production uses **Convex Cloud** for the backend and **Vercel** for the Next.js app. Do not commit `.env.local`; production gets config from Convex and Vercel only.

### 1. Switch Convex to cloud

- In the project root, run: `npx convex dev`.
- When prompted, choose **Use cloud** (not local deployment). Use your existing Convex project or create one.
- Convex will update `.env.local` with:
  - `CONVEX_DEPLOYMENT=<cloud-deployment-key>` (e.g. `dev:...`)
  - `NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud`
- Let Convex push your `convex/` functions to the cloud deployment.
- Seed the cloud database once: `npx convex run seed:run`.

### 2. Deploy Next.js to Vercel

- Push the project to **GitHub** (or GitLab/Bitbucket).
- In [Vercel](https://vercel.com): **Add New Project** and import the repo. Keep default framework (Next.js) and root directory.
- In the Vercel project go to **Settings → Environment Variables** and add:

  | Name | Value |
  |------|--------|
  | `NEXT_PUBLIC_CONVEX_URL` | Your Convex Cloud URL (e.g. `https://....convex.cloud` from the [Convex dashboard](https://dashboard.convex.dev)) |

  Apply to Production and Preview (or use a separate Convex production deployment URL for Production).

- Deploy (push to main or click **Deploy** in Vercel). The app will be at `https://<project>.vercel.app` and will use Convex Cloud via `NEXT_PUBLIC_CONVEX_URL`.

### 3. Optional: production Convex deployment

- In the Convex dashboard you can create a **production** deployment. Push with `npx convex deploy --prod` and set `NEXT_PUBLIC_CONVEX_URL` in Vercel to that deployment’s URL for Production.

## Troubleshooting

### "Failed to load SWC binary" (Windows)

If `npm run dev` fails with **Failed to load SWC binary for win32/x64** or "not a valid Win32 application":

1. **Babel fallback** – This repo includes a `.babelrc` so Next.js uses Babel instead of SWC when the SWC binary fails. Run `npm run dev` again.

2. **Clean reinstall** – If it still fails, reinstall dependencies:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   npm run dev
   ```

3. **Node architecture** – Use 64-bit Node on 64-bit Windows: `node -p "process.arch"` should print `x64`. If it prints `ia32`, install Node.js x64.

4. **Visual C++ Redistributable** – On Windows, install the [x64 VC++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) if you see DLL errors.

## Project layout (high level)

- `app/` – Next.js App Router (dashboard, shipments, excursions, audit, policies, data/upload).
- `components/` – KPICard, TemperatureChart, AuditLogTable, AIInsightCard.
- `convex/` – Schema, seed; ingestion (parse, upload action, mutations); policies (engine, queries, mutations); excursions (detect); risk (scoring, mutations); ai (analysis, storage); audit; users; dashboard queries; export action.
- `data/mock/` – Sample CSV and JSON for demos.

## License

MIT.
