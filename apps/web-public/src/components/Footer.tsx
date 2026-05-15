import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

const productLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Register Institute", href: "/register" },
  { label: "Login", href: "/login-options" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Refund Policy", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080e1a]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f4b860] to-[#e09530]">
                <GraduationCap className="h-5 w-5 text-[#1a1a1a]" />
              </div>
              <span className="text-xl font-bold tracking-wide">
                <span className="text-[#f4b860]">VE</span>
                <span className="text-white">DAS</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              The all-in-one platform to digitize and scale your coaching institute.
              Manage students, fees, tests, and more — effortlessly.
            </p>
            <div className="flex gap-3 pt-2">
              {/* Social Icons */}
              {["X", "In", "YT"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-[#f4b860] hover:border-[#f4b860]/30 transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-[#f4b860] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-[#f4b860] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-[#f4b860] mt-0.5 shrink-0" />
                <span className="text-sm text-slate-400">hello@vedas.app</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-[#f4b860] mt-0.5 shrink-0" />
                <span className="text-sm text-slate-400">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#f4b860] mt-0.5 shrink-0" />
                <span className="text-sm text-slate-400">Indore, Madhya Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} VEDAS. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
