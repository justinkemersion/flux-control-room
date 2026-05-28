"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function FluxUserSubCard({ sub }: { sub: string }) {
  const [copied, setCopied] = useState<"sub" | "env" | null>(null);
  const envLine = `CONTROL_ROOM_USER_SUB=${sub}`;

  async function handleCopy(kind: "sub" | "env", text: string) {
    const ok = await copyText(text);
    if (ok) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <p className="text-xs uppercase tracking-wide text-[var(--muted-fg)]">Flux user id</p>
      <p className="mt-1 text-xs text-[var(--muted-fg)]">
        Use this as <code className="font-mono">CONTROL_ROOM_USER_SUB</code> in{" "}
        <code className="font-mono">.env</code> for seed and runner scripts.
      </p>
      <code className="mt-3 block break-all rounded-md border border-[var(--border)] bg-[var(--background)] p-2 font-mono text-sm">
        {sub}
      </code>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() => handleCopy("sub", sub)}
        >
          {copied === "sub" ? "Copied" : "Copy id"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() => handleCopy("env", envLine)}
        >
          {copied === "env" ? "Copied" : "Copy .env line"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-[var(--muted-fg)]">
        Then run{" "}
        <code className="font-mono">pnpm seed:control-room</code> or pass once:{" "}
        <code className="font-mono">pnpm seed:control-room -- --sub {sub.slice(0, 8)}…</code>
      </p>
    </Card>
  );
}
