import Image from "next/image";
import { HomeLinks } from "./HomeLinks";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-primary">
      <Image src="/logo.svg" alt="ThermoGuard" width={64} height={64} className="mb-4" />
      <h1 className="text-3xl font-bold text-white mb-2">ThermoGuard</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Cold chain compliance for companies that ship food and pharmaceuticals.
      </p>
      <HomeLinks />
    </main>
  );
}
