import { AboutContent } from "./AboutContent";
import { AboutHeader } from "./AboutHeader";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-primary text-slate-200">
      <AboutHeader />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <AboutContent />
      </div>
    </main>
  );
}
