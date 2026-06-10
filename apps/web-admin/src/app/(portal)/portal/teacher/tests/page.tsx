"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function TeacherTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadTests = async () => {
    const res = await api.get("/tests");
    setTests(res.data.tests ?? res.data.data ?? []);
  };

  useEffect(() => {
    loadTests()
      .catch(() => toast.error("Failed to load tests"))
      .finally(() => setLoading(false));
  }, []);

  const publish = async (testId: string) => {
    try {
      await api.post(`/tests/${testId}/publish`);
      toast.success("Test published");
      await loadTests();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to publish test");
    }
  };

  const remove = async (testId: string) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await api.delete(`/tests/${testId}`);
      setTests((prev) => prev.filter((test) => test.id !== testId));
      toast.success("Test deleted");
    } catch {
      toast.error("Failed to delete test");
    }
  };

  const statusClass: Record<string, string> = {
    draft: "bg-slate-700 text-slate-300",
    scheduled: "bg-blue-500/20 text-blue-300",
    ongoing: "bg-teal-500/20 text-teal-300",
    completed: "bg-purple-500/20 text-purple-300",
    archived: "bg-slate-800 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tests</h1>
          <p className="mt-1 text-sm text-slate-400">Create, publish, and review your assessments.</p>
        </div>
        <button onClick={() => router.push("/tests/new")} className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400">
          Create Test
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">
          No tests created yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-medium text-white">{test.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusClass[test.status] ?? statusClass.draft}`}>
                      {test.status ?? "draft"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {test.duration_minutes ?? 0} mins | {test.total_marks ?? 0} marks | {test.question_count ?? 0} questions
                  </p>
                  {test.start_time && <p className="mt-1 text-xs text-slate-500">Starts {new Date(test.start_time).toLocaleString()}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(test.status ?? "draft") === "draft" && (
                    <button onClick={() => publish(test.id)} className="rounded-lg bg-teal-500/10 px-3 py-1.5 text-xs text-teal-300 hover:bg-teal-500/20">
                      Publish
                    </button>
                  )}
                  <button onClick={() => router.push(`/tests/${test.id}/analytics`)} className="rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-500/20">
                    Results
                  </button>
                  <button onClick={() => remove(test.id)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
