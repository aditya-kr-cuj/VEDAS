"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contactInfo = [
  { icon: Mail, label: "Email", value: "hello@vedas.app", href: "mailto:hello@vedas.app" },
  { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
  { icon: MapPin, label: "Address", value: "Indore, Madhya Pradesh, India", href: "#" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white">Get in Touch</h1>
          <p className="mt-4 text-lg text-slate-400">
            Have questions? Want a demo? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/8 bg-white/[0.03] hover:border-white/15 transition-all duration-200"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4b860]/10">
                  <item.icon className="h-5 w-5 text-[#f4b860]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-white mt-0.5">{item.value}</p>
                </div>
              </a>
            ))}

            <div className="p-5 rounded-2xl border border-[#f4b860]/20 bg-[#f4b860]/[0.05]">
              <p className="text-sm font-semibold text-[#f4b860] mb-1">Schedule a Demo</p>
              <p className="text-xs text-slate-400">
                Want to see VEDAS in action? Book a 30-minute demo with our team and we&apos;ll walk you through the platform.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#86e3ce]/10">
                    <Send className="h-7 w-7 text-[#86e3ce]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Message Sent!</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Full Name</Label>
                      <Input id="contact-name" placeholder="Your name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input id="contact-email" type="email" placeholder="you@example.com" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone (Optional)</Label>
                    <Input id="contact-phone" placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input id="contact-subject" placeholder="How can we help?" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      placeholder="Tell us about your institute and what you're looking for..."
                      required
                      className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
