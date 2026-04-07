"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Test = {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
};

export default function StudentTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);

  useEffect(() => {
    api.get("/student/tests").then((res) => setTests(res.data.tests ?? [])).catch(() => setTests([]));
  }, []);

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">My Tests</h2>
        <p className="text-sm text-slate-400">Upcoming and completed assessments.</p>
        <div className="mt-2">
          <Link href="/portal/student/tests/performance" className="text-xs text-blue-300 underline">
            View Performance Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((test) => {
          const start = test.start_time ? new Date(test.start_time) : null;
          const end = test.end_time ? new Date(test.end_time) : null;
          const isUpcoming = start && start > now;
          const isOngoing = start && end && start <= now && end >= now;
          const statusLabel = isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : "Completed";

          return (
            <Card key={test.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{test.title}</h3>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-slate-300">
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {start ? start.toLocaleString() : "No schedule"} • {test.duration_minutes} mins
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {isOngoing ? (
                    <Link href={`/portal/student/tests/${test.id}/attempt`}>
                      <Button size="sm">Start / Resume</Button>
                    </Link>
                  ) : !isUpcoming ? (
                    <Link href={`/portal/student/tests/${test.id}/result`}>
                      <Button size="sm" variant="outline">
                        View Result
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Starts soon</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
