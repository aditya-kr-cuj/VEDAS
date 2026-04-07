"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

interface Template {
  id: string;
  name: string;
  language: string;
  body_text: string;
  param_count: number;
  is_active: boolean;
  created_at: string;
}

interface Optin {
  phone: string;
  opted_in: boolean;
  opted_in_at: string;
}

export default function WhatsAppSettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [optins, setOptins] = useState<Optin[]>([]);
  const [loading, setLoading] = useState(true);

  // New template form
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState("en");
  const [newBody, setNewBody] = useState("");
  const [newParamCount, setNewParamCount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, oRes] = await Promise.all([
        api.get("/notifications/whatsapp/templates"),
        api.get("/notifications/whatsapp/optins"),
      ]);
      setTemplates(tRes.data.templates ?? []);
      setOptins(oRes.data.optins ?? []);
    } catch {
      console.error("Failed to load WhatsApp settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddTemplate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setSuccess("");
    try {
      await api.post("/notifications/whatsapp/templates", {
        name: newName.trim(),
        language: newLang,
        body_text: newBody,
        param_count: Number(newParamCount) || 0,
      });
      setNewName("");
      setNewBody("");
      setNewParamCount("0");
      setSuccess("Template added");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch {
      console.error("Failed to add template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">💬</span> WhatsApp Settings
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage message templates and user opt-in status
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-amber-500/20">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-400">WhatsApp Policy</p>
            <p className="mt-0.5 text-xs text-slate-400">
              WhatsApp only allows pre-approved template messages. Templates must be submitted and approved via Meta Business Manager before they can be used. Add templates here to track them in VEDAS.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Template */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-sm font-medium text-slate-400">Add Template</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Template Name</label>
                <Input
                  id="wa-template-name"
                  placeholder="e.g. fee_reminder"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-slate-900/80"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Language</label>
                  <select
                    id="wa-template-lang"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className="h-9 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-200 outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="bn">Bengali</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Parameter Count</label>
                  <Input
                    id="wa-template-params"
                    type="number"
                    min="0"
                    max="10"
                    value={newParamCount}
                    onChange={(e) => setNewParamCount(e.target.value)}
                    className="bg-slate-900/80"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Body Preview</label>
                <textarea
                  id="wa-template-body"
                  placeholder="Your fee of {{1}} is due on {{2}}"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 resize-none"
                />
              </div>
              <Button id="wa-add-template-btn" onClick={handleAddTemplate} disabled={saving || !newName.trim()}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Adding…
                  </span>
                ) : "Add Template"}
              </Button>
              {success && (
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 text-sm font-medium text-slate-400">
              Registered Templates ({templates.length})
            </h3>
            {templates.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No templates registered</p>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.05]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{t.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {t.body_text || "No preview"} · {t.param_count} params · {t.language}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        t.is_active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Opt-ins Section */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-white/5 px-6 py-4">
            <h3 className="text-sm font-medium text-slate-400">
              User Opt-ins ({optins.length})
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Users who have opted in to receive WhatsApp messages
            </p>
          </div>
          {optins.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No opt-in records yet
            </div>
          ) : (
            <Table>
              <THead>
                <TR className="border-white/5 hover:bg-transparent">
                  <TH className="text-slate-400">Phone</TH>
                  <TH className="text-slate-400">Status</TH>
                  <TH className="text-slate-400">Opted In At</TH>
                </TR>
              </THead>
              <TBody>
                {optins.map((o) => (
                  <TR key={o.phone} className="border-white/5 transition hover:bg-white/[0.03]">
                    <TD className="font-mono text-sm text-slate-200">{o.phone}</TD>
                    <TD>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          o.opted_in
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {o.opted_in ? "Opted In" : "Opted Out"}
                      </span>
                    </TD>
                    <TD className="text-xs text-slate-400">
                      {new Date(o.opted_in_at).toLocaleDateString("en-IN")}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
