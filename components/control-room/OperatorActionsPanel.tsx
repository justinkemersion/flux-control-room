"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { operatorAction } from "@/app/(dashboard)/actions/control-room";
import { OPERATOR_ACTIONS, type OperatorActionKey } from "@/lib/types/control-room";

export function OperatorActionsPanel() {
  const [pending, startTransition] = useTransition();

  function run(actionKey: OperatorActionKey) {
    startTransition(async () => {
      await operatorAction(actionKey);
    });
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Operator actions</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(OPERATOR_ACTIONS) as OperatorActionKey[]).map((key) => (
          <Button
            key={key}
            variant="secondary"
            type="button"
            disabled={pending}
            className="min-h-11 text-left text-xs"
            onClick={() => run(key)}
          >
            {OPERATOR_ACTIONS[key].label}
          </Button>
        ))}
      </div>
    </section>
  );
}
