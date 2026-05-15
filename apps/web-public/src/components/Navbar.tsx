"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, GraduationCap } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0b1220]/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f4b860] to-[#e09530] shadow-lg shadow-[#f4b860]/20 transition-transform group-hover:scale-110">
            <GraduationCap className="h-5 w-5 text-[#1a1a1a]" />
          </div>
          <span className="text-xl font-bold tracking-wide">
            <span className="text-[#f4b860]">VE</span>
            <span className="text-white">DAS</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login-options"
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] bg-gradient-to-r from-[#f4b860] to-[#e09530] rounded-xl hover:shadow-lg hover:shadow-[#f4b860]/25 transition-all duration-200 hover:-translate-y-0.5"
          >
            Register Institute
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0b1220]/95 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-2 border-t border-white/10 mt-2">
              <Link
                href="/login-options"
                className="block w-full text-center px-5 py-2.5 text-sm font-medium text-slate-300 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block w-full text-center px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] bg-gradient-to-r from-[#f4b860] to-[#e09530] rounded-xl transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Register Institute
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
