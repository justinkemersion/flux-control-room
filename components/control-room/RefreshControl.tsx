"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function RefreshControl() {
  const router = useRouter();

  return (
    <div className="mb-4 flex justify-end">
      <Button variant="secondary" type="button" onClick={() => router.refresh()}>
        Refresh
      </Button>
    </div>
  );
}
