export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function actionError(error: unknown): ActionResult<never> {
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Something went wrong" };
}
