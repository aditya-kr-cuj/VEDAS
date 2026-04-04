"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConfirmResetPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    try {
      await api.post("/password/confirm", { token, newPassword: password });
      setStatus("Password updated. You can log in now.");
    } catch {
      setStatus("Reset failed. Check your token.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Reset Token</Label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token from email" />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={submit}>Update Password</Button>
          {status && <p className="text-sm text-slate-400">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
