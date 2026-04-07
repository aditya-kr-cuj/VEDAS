"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentQrPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    try {
      await api.post("/attendance/scan-qr", { token });
      setStatus("Attendance marked successfully.");
    } catch {
      setStatus("Invalid or expired QR token.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Scan QR (Token)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>QR Token</Label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token here" />
          </div>
          <Button onClick={submit}>Mark Attendance</Button>
          {status && <p className="text-sm text-slate-400">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
