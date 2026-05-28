"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionSub } from "@/lib/flux/auth";
import { createJob } from "@/lib/flux/runner-jobs";
import { createEvent } from "@/lib/flux/signal-events";
import { createOperatorAction } from "@/lib/flux/operator-actions";
import { actionError, type ActionResult } from "@/lib/actions/result";
import { OPERATOR_ACTIONS, type OperatorActionKey } from "@/lib/types/control-room";

const actionKeySchema = z.enum([
  "stabilize_core",
  "flush_queue",
  "rotate_signal",
  "run_diagnostic",
  "ack_anomalies",
  "controlled_reset",
]);

export async function operatorAction(
  actionKey: OperatorActionKey,
): Promise<ActionResult<{ jobId: string }>> {
  try {
    const sub = await requireSessionSub();
    const key = actionKeySchema.parse(actionKey);
    const def = OPERATOR_ACTIONS[key];

    const job = await createJob(sub, {
      job_type: def.jobType,
      payload: { action_key: key },
    });

    await createOperatorAction(sub, {
      action_key: key,
      label: def.label,
      enqueued_job_id: job.id,
    });

    await createEvent(sub, {
      severity: "info",
      source: "operator",
      message: `${def.label} requested`,
      metadata: { action_key: key, job_id: job.id },
    });

    revalidatePath("/control-room");
    return { ok: true, data: { jobId: job.id } };
  } catch (e) {
    return actionError(e);
  }
}
