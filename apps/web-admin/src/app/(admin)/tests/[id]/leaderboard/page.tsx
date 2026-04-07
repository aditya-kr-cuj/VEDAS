"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TestLeaderboardPage() {
  const params = useParams();
  const id = params?.id as string;
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get(`/tests/${id}/leaderboard`).then((res) => setLeaderboard(res.data.leaderboard ?? []));
  }, [id]);

  const filtered = leaderboard.filter((item) =>
    item.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Leaderboard</h2>
        <p className="text-sm text-slate-400">Ranked by total marks.</p>
      </div>

      <Input placeholder="Search student" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2">
        {filtered.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="flex items-center justify-between p-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-white">#{item.rank}</span>
                <div>
                  <p className="font-semibold">{item.student_name}</p>
                  <p className="text-xs text-slate-500">{item.student_email}</p>
                </div>
              </div>
              <div className="text-right">
                <p>{item.total_marks_obtained} marks</p>
                <p className="text-xs text-slate-400">{item.percentage}%</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
