"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Types ─────────────────────────────────────────────────────────────────────
type Category = {
  id: string;
  category_name: string;
  category_type: "fixed" | "variable";
  parent_category_id: string | null;
  parent_name: string | null;
};

type FormState = {
  expenseCategoryId: string;
  amount: string;
  expenseDate: string;
  description: string;
  paymentMode: "cash" | "bank_transfer" | "cheque" | "card";
  vendorName: string;
  receiptUrl: string;
  isRecurring: boolean;
  recurrenceFrequency: "monthly" | "quarterly" | "yearly" | "";
  // Category creation
  newCategoryName: string;
  newCategoryType: "fixed" | "variable";
  newCategoryParent: string;
};

const PAYMENT_MODES = [
  { value: "cash",          label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque",        label: "Cheque" },
  { value: "card",          label: "Card" }
] as const;

const RECURRENCE_OPTIONS = [
  { value: "monthly",   label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly",    label: "Yearly" }
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddExpensePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<FormState>({
    expenseCategoryId: "",
    amount: "",
    expenseDate: today,
    description: "",
    paymentMode: "cash",
    vendorName: "",
    receiptUrl: "",
    isRecurring: false,
    recurrenceFrequency: "",
    newCategoryName: "",
    newCategoryType: "variable",
    newCategoryParent: ""
  });

  const loadCategories = async () => {
    try {
      const res = await api.get("/expenses/categories");
      setCategories(res.data.categories ?? []);
    } catch {
      // silent
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Category creation ─────────────────────────────────────────────────────
  const handleCreateCategory = async () => {
    if (!form.newCategoryName.trim()) {
      setCatError("Category name is required");
      return;
    }
    setCreatingCategory(true);
    setCatError(null);
    try {
      const res = await api.post("/expenses/categories", {
        categoryName:     form.newCategoryName.trim(),
        categoryType:     form.newCategoryType,
        parentCategoryId: form.newCategoryParent || null
      });
      await loadCategories();
      set("expenseCategoryId", res.data.category.id);
      setShowNewCategory(false);
      set("newCategoryName", "");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        setCatError(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ?? "Failed to create category"
        );
      }
    } finally {
      setCreatingCategory(false);
    }
  };

  // ── Expense submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.expenseCategoryId) { setError("Please select or create a category"); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter a valid positive amount");
      return;
    }
    if (!form.expenseDate) { setError("Expense date is required"); return; }
    if (form.isRecurring && !form.recurrenceFrequency) {
      setError("Select a recurrence frequency for recurring expenses");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/expenses", {
        expenseCategoryId:   form.expenseCategoryId,
        amount:              Number(form.amount),
        expenseDate:         form.expenseDate,
        description:         form.description || undefined,
        paymentMode:         form.paymentMode,
        vendorName:          form.vendorName || undefined,
        receiptUrl:          form.receiptUrl || undefined,
        isRecurring:         form.isRecurring,
        recurrenceFrequency: form.isRecurring ? form.recurrenceFrequency : null
      });
      router.push("/expenses");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ?? "Failed to save expense"
        );
      } else {
        setError("Failed to save expense");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Group categories with parents shown under them
  const topLevel = categories.filter((c) => !c.parent_category_id);
  const subCategories = categories.filter((c) => !!c.parent_category_id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
        <h2 className="mt-2 text-2xl font-semibold">Add Expense</h2>
        <p className="mt-1 text-sm text-slate-400">Record a new expense for your institute.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category selection */}
        <Card className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Expense Category</p>

          <div className="space-y-1">
            <Label htmlFor="expense-category">Category *</Label>
            <div className="flex gap-2">
              <select
                id="expense-category"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                value={form.expenseCategoryId}
                onChange={(e) => set("expenseCategoryId", e.target.value)}
                required
              >
                <option value="">— Select category —</option>
                {topLevel.map((c) => (
                  <optgroup key={c.id} label={`${c.category_name} (${c.category_type})`}>
                    <option value={c.id}>{c.category_name}</option>
                    {subCategories
                      .filter((s) => s.parent_category_id === c.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          &nbsp;&nbsp;↳ {s.category_name}
                        </option>
                      ))}
                  </optgroup>
                ))}
                {/* orphan subcategories */}
                {subCategories
                  .filter((s) => !topLevel.find((t) => t.id === s.parent_category_id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.category_name}</option>
                  ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewCategory((v) => !v)}
              >
                {showNewCategory ? "Cancel" : "+ New"}
              </Button>
            </div>
          </div>

          {/* Inline category creation */}
          {showNewCategory && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                New Category
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input
                    value={form.newCategoryName}
                    onChange={(e) => set("newCategoryName", e.target.value)}
                    placeholder="e.g. Salaries, Rent"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                    value={form.newCategoryType}
                    onChange={(e) => set("newCategoryType", e.target.value as "fixed" | "variable")}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Parent Category (optional)</Label>
                  <select
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                    value={form.newCategoryParent}
                    onChange={(e) => set("newCategoryParent", e.target.value)}
                  >
                    <option value="">None (top-level)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {catError && <p className="text-sm text-red-400">{catError}</p>}
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                disabled={creatingCategory}
              >
                {creatingCategory ? "Creating…" : "Create Category"}
              </Button>
            </div>
          )}
        </Card>

        {/* Amount & Date */}
        <Card className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Expense Details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="expense-amount">Amount (₹) *</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expense-date">Expense Date *</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.expenseDate}
                onChange={(e) => set("expenseDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="expense-description">Description</Label>
            <textarea
              id="expense-description"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What was this expense for?"
            />
          </div>
        </Card>

        {/* Payment & Vendor */}
        <Card className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Payment & Vendor</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="payment-mode">Payment Mode *</Label>
              <select
                id="payment-mode"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                value={form.paymentMode}
                onChange={(e) => set("paymentMode", e.target.value as FormState["paymentMode"])}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="vendor-name">Vendor / Payee Name</Label>
              <Input
                id="vendor-name"
                value={form.vendorName}
                onChange={(e) => set("vendorName", e.target.value)}
                placeholder="e.g. Indane Gas, ABC Stationery"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="receipt-url">Receipt URL / Link</Label>
            <Input
              id="receipt-url"
              type="url"
              value={form.receiptUrl}
              onChange={(e) => set("receiptUrl", e.target.value)}
              placeholder="https://drive.google.com/... or S3 link"
            />
            <p className="text-xs text-slate-500">
              Upload the receipt image to Google Drive / S3 and paste the link here.
            </p>
          </div>
        </Card>

        {/* Recurring */}
        <Card className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Recurrence</p>
          <label className="flex cursor-pointer items-center gap-3">
            <div
              role="checkbox"
              aria-checked={form.isRecurring}
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                form.isRecurring
                  ? "border-violet-500 bg-violet-500"
                  : "border-white/30 bg-white/5"
              }`}
              onClick={() => set("isRecurring", !form.isRecurring)}
            >
              {form.isRecurring && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-200">This is a recurring expense</p>
              <p className="text-xs text-slate-400">E.g. monthly rent, salary, subscriptions</p>
            </div>
          </label>

          {form.isRecurring && (
            <div className="space-y-1">
              <Label>Recurrence Frequency *</Label>
              <div className="flex gap-2 flex-wrap">
                {RECURRENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("recurrenceFrequency", opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.recurrenceFrequency === opt.value
                        ? "bg-violet-600 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Error & Submit */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? "Saving…" : "Save Expense"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/expenses")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
