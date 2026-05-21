import type { Metadata } from "next";
import { MainNav } from "@/components/nav";
import { isReadOnlyModeEnabled, READ_ONLY_MESSAGE } from "@/lib/read-only";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ogród MVP",
  description: "Polska aplikacja MVP do zarządzania ogrodem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const readOnly = isReadOnlyModeEnabled();

  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="flex min-h-screen flex-col md:flex-row">
          <MainNav />
          <main className="flex-1 p-4 md:p-6">
            {readOnly ? (
              <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {READ_ONLY_MESSAGE}
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
