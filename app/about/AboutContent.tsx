"use client";

export function AboutContent() {
  return (
    <div className="space-y-12 w-full max-w-full">
      {/* Hero with image */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/50">
        <div className="aspect-[21/9] w-full bg-slate-800">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80"
            alt="Cold chain logistics"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent flex flex-col justify-end p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">About ThermoGuard</h1>
          <p className="text-slate-200 text-lg max-w-2xl">
            ThermoGuard helps companies that ship food and pharmaceuticals monitor cold chain
            compliance, detect temperature excursions, and maintain audit-ready records.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-xl font-semibold text-white mb-3">Who we serve</h2>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0 w-full md:w-64 aspect-video rounded-lg overflow-hidden bg-slate-700">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
              alt="Temperature-controlled storage"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-slate-300 mb-2">
              We serve companies that move temperature-sensitive products in the cold chain:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-2">
              <li>Food producers and distributors (dairy, produce, frozen goods) under HACCP/FSMA</li>
              <li>Pharmaceutical and biotech companies (vaccines, biologics) under GDP/GxP</li>
              <li>Logistics and 3PL providers managing cold storage and transport</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-xl font-semibold text-white mb-3">About this platform</h2>
        <p className="text-slate-300 leading-relaxed">
          ThermoGuard is a cold chain compliance platform that ingests temperature data from
          CSV, JSON, or APIs; normalizes and consolidates it into a single source of truth;
          detects excursions against configurable policies (threshold, duration, repeated
          violations); scores risk per shipment; and maintains an append-only audit log with
          optional AI-generated explanations. Role-based dashboards let admins manage policies,
          supervisors upload data, and viewers monitor KPIs and excursions.
        </p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
        <ul className="text-slate-300 space-y-2">
          <li><strong className="text-slate-200">Address:</strong> 123 Cold Chain Way, Suite 400, Boston, MA 02108</li>
          <li><strong className="text-slate-200">Phone:</strong> +1 (555) 123-4567</li>
          <li><strong className="text-slate-200">Email:</strong> contact@thermoguard.example.com</li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-xl font-semibold text-white mb-3">Follow us</h2>
        <div className="flex gap-6">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            Twitter / X
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-xl font-semibold text-white mb-3">Pricing</h2>
        <p className="text-slate-300 mb-4">
          Simple SaaS subscription for cold chain compliance monitoring and audit-ready records.
        </p>
        <div className="inline-flex items-baseline gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-4">
          <span className="text-3xl font-bold text-white">$25</span>
          <span className="text-slate-400">/month</span>
        </div>
        <p className="text-slate-500 text-sm mt-3">
          Per organization. Includes dashboards, excursion detection, risk scoring, and AI insights.
        </p>
      </section>
    </div>
  );
}
