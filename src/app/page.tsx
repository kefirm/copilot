import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function DashboardPage() {
  const db = await readDb();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Rośliny" value={db.plants.length} href="/rosliny" />
        <StatCard label="Grupy" value={db.groups.length} href="/grupy" />
        <StatCard label="Zabiegi" value={db.treatments.length} href="/zabiegi" />
        <StatCard label="Produkty" value={db.products.length} href="/produkty" />
        <StatCard label="Obserwacje" value={db.observations.length} href="/obserwacje" />
      </div>
      <p className="text-sm text-zinc-600">
        MVP działa lokalnie, bez logowania i bez zewnętrznej bazy. Wszystkie dane są zapisywane w pliku
        <code className="mx-1 rounded bg-zinc-200 px-1 py-0.5">data/db.json</code>.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-100">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </Link>
  );
}
