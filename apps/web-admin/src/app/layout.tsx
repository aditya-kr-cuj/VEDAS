import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "VEDAS Admin",
  description: "Institute admin dashboard for VEDAS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans")}>
      <body className="min-h-full bg-slate-950 text-slate-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
