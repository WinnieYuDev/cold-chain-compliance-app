import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-primary">
      <h1 className="text-3xl font-bold text-white mb-4">
        Cold Chain Compliance Monitor
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Enterprise cold chain compliance for Food and Pharmaceutical industries.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800"
        >
          Register company
        </Link>
      </div>
    </main>
  );
}
