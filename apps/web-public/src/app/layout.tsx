import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "VEDAS | Coaching Institute Management Platform",
    template: "%s | VEDAS",
  },
  description:
    "One platform for admissions, attendance, tests, performance, fees, and communication. Built for coaching institutes that want to grow.",
  keywords: [
    "coaching institute software",
    "institute management",
    "EdTech",
    "attendance tracking",
    "fee management",
    "test management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans")}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#0b1220] text-slate-50">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
