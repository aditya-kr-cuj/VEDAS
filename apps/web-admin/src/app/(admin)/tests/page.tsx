"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Test = {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
};

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [tab, setTab] = useState<"upcoming" | "ongoing" | "completed">("upcoming");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    api
      .get("/tests", { params: { include_archived: showArchived } })
      .then((res) => setTests(res.data.tests ?? []))
      .catch(() => setTests([]));
  }, [showArchived]);

  const filtered = tests.filter((test) => {
    if (tab === "upcoming") return test.status === "scheduled" || test.status === "draft";
    if (tab === "ongoing") return test.status === "ongoing";
    return test.status === "completed";
  });

  const publish = async (id: string) => {
    await api.post(`/tests/${id}/publish`);
    const res = await api.get("/tests");
    setTests(res.data.tests ?? []);
  };

  const remove = async (id: string) => {
    await api.delete(`/tests/${id}`);
    setTests((prev) => prev.filter((t) => t.id !== id));
  };

  const archive = async (id: string) => {
    await api.patch(`/tests/${id}/archive`, { archived: true });
    const res = await api.get("/tests");
    setTests(res.data.tests ?? []);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Tests</h2>
          <p className="text-sm text-slate-400">Create and schedule exams for your batches.</p>
        </div>
        <Link href="/tests/new">
          <Button>New Test</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant={tab === "upcoming" ? "default" : "outline"} onClick={() => setTab("upcoming")}>
          Upcoming
        </Button>
        <Button size="sm" variant={tab === "ongoing" ? "default" : "outline"} onClick={() => setTab("ongoing")}>
          Ongoing
        </Button>
        <Button size="sm" variant={tab === "completed" ? "default" : "outline"} onClick={() => setTab("completed")}>
          Completed
        </Button>
        <label className="ml-2 flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={showArchived} onChange={() => setShowArchived((v) => !v)} />
          Show archived
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((test) => (
          <Card key={test.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{test.title}</h3>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-slate-300">
                  {test.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {test.start_time ? new Date(test.start_time).toLocaleString() : "No start time"} •{" "}
                {test.duration_minutes} mins
              </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link href={`/tests/new?id=${test.id}`} className="text-blue-300">
                    Edit
                  </Link>
                  <Link href={`/tests/${test.id}/evaluate`} className="text-amber-300">
                    Evaluate
                  </Link>
                  <Link href={`/tests/${test.id}/analytics`} className="text-sky-300">
                    Analytics
                  </Link>
                  <Link href={`/tests/${test.id}/leaderboard`} className="text-purple-300">
                    Leaderboard
                  </Link>
                  <button className="text-emerald-300" onClick={() => publish(test.id)}>
                    Publish
                  </button>
                  <button className="text-slate-300" onClick={() => archive(test.id)}>
                    Archive
                  </button>
                  <button className="text-red-300" onClick={() => remove(test.id)}>
                    Delete
                  </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
