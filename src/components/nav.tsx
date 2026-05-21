import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/mapa", label: "Mapa" },
  { href: "/rosliny", label: "Rośliny" },
  { href: "/grupy", label: "Grupy" },
  { href: "/zabiegi", label: "Zabiegi" },
  { href: "/produkty", label: "Produkty" },
  { href: "/obserwacje", label: "Obserwacje" },
];

export function MainNav() {
  return (
    <aside className="w-full border-b border-zinc-200 bg-white p-4 md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="mb-4 text-lg font-semibold">Ogród MVP</div>
      <nav className="flex flex-wrap gap-2 md:flex-col">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
