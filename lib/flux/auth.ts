import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Returns stable OAuth subject for Flux RLS / JWT `sub`. */
export async function requireSessionSub(): Promise<string> {
  const session = await auth();
  const sub = session?.user?.id;
  if (!sub) {
    throw new UnauthorizedError();
  }
  return sub;
}
