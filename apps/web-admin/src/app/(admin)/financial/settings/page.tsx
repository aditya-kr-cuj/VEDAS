"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TaxSettings = {
  gst_number: string | null;
  tax_rate: number;
  tax_regime: "gst" | "vat" | "none";
  financial_year_start_month: number;
};

export default function FinancialSettingsPage() {
  const [settings, setSettings] = useState<TaxSettings>({
    gst_number: "",
    tax_rate: 0,
    tax_regime: "none",
    financial_year_start_month: 4
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/financial/settings/tax");
        const data = res.data.settings as TaxSettings;
        setSettings({
          gst_number: data.gst_number ?? "",
          tax_rate: Number(data.tax_rate ?? 0),
          tax_regime: data.tax_regime ?? "none",
          financial_year_start_month: Number(data.financial_year_start_month ?? 4)
        });
      } catch {
        setMessage("Failed to load tax settings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const set = <K extends keyof TaxSettings>(key: K, value: TaxSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/financial/settings/tax", {
        gstNumber: settings.gst_number || null,
        taxRate: Number(settings.tax_rate),
        taxRegime: settings.tax_regime,
        financialYearStartMonth: Number(settings.financial_year_start_month)
      });
      setMessage("Tax settings saved successfully.");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        setMessage((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to save settings");
      } else {
        setMessage("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
        <h2 className="mt-1 text-2xl font-semibold">Tax Settings</h2>
        <p className="mt-0.5 text-sm text-slate-400">Configure GST number, tax regime, tax rate, and financial year start month.</p>
      </div>

      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-slate-400">Loading settings...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="gst-number">GST Number</Label>
              <Input
                id="gst-number"
                value={settings.gst_number ?? ""}
                onChange={(e) => set("gst_number", e.target.value)}
                placeholder="e.g. 29ABCDE1234F2Z5"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.tax_rate}
                onChange={(e) => set("tax_rate", Number(e.target.value || 0))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tax-regime">Tax Regime</Label>
              <select
                id="tax-regime"
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                value={settings.tax_regime}
                onChange={(e) => set("tax_regime", e.target.value as "gst" | "vat" | "none")}
              >
                <option value="none">None</option>
                <option value="gst">GST</option>
                <option value="vat">VAT</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="fy-start">Financial Year Start Month</Label>
              <Input
                id="fy-start"
                type="number"
                min="1"
                max="12"
                value={settings.financial_year_start_month}
                onChange={(e) => set("financial_year_start_month", Number(e.target.value || 4))}
              />
              <p className="text-xs text-slate-500">Use `4` for April (India FY standard).</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          {message && <p className="text-sm text-slate-300">{message}</p>}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold">Upcoming Compliance Features</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>Invoice numbering for fee payments is now enabled in backend exports and GST data.</li>
          <li>E-invoice generation marked as future enhancement.</li>
          <li>TDS calculation can be added as a next module based on deduction rules.</li>
        </ul>
      </Card>
    </div>
  );
}
