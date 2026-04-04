"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    try {
      await api.post("/password/request", { email });
      setStatus("If the email exists, a reset token has been sent.");
    } catch {
      setStatus("Request failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button onClick={submit}>Send Reset Email</Button>
          {status && <p className="text-sm text-slate-400">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
