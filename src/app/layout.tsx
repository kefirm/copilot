import type { Metadata } from "next";
import { MainNav } from "@/components/main-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ogród MVP",
  description: "Aplikacja do zarządzania ogrodem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full bg-zinc-100 text-zinc-900">
        <MainNav />
        <main className="mx-auto w-full max-w-[1400px] p-4">{children}</main>
      </body>
    </html>
  );
}
