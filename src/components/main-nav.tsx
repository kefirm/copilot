"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  return (
    <nav className="border-b border-emerald-200 bg-emerald-50">
      <div className="mx-auto flex max-w-[1400px] flex-wrap gap-2 px-4 py-3">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
