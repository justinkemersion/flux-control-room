/** Shared sub resolution for seed/runner scripts (env, flags, hints). */
export function subFromArgv(argv = process.argv): string | undefined {
  const flagIdx = argv.indexOf("--sub");
  if (flagIdx !== -1) {
    const value = argv[flagIdx + 1]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function resolveControlRoomSub(argv = process.argv): string {
  return (
    subFromArgv(argv) ||
    process.env.CONTROL_ROOM_USER_SUB?.trim() ||
    process.env.DEMO_USER_SUB?.trim() ||
    ""
  );
}

export const CONTROL_ROOM_SUB_HINT = [
  "Set CONTROL_ROOM_USER_SUB (or DEMO_USER_SUB) in .env, or pass --sub on the command line.",
  "",
  "Easiest:",
  "  1. pnpm dev → sign in at http://localhost:3000",
  "  2. Copy your Flux user id from the home page",
  "  3. Add to .env:  CONTROL_ROOM_USER_SUB=<copied id>",
  "     Or one-shot:  pnpm seed:control-room -- --sub <copied id>",
].join("\n");
