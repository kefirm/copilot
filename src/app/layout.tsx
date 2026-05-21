import type { Metadata } from "next";
import { MainNav } from "@/components/nav";
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
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="flex min-h-screen flex-col md:flex-row">
          <MainNav />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
