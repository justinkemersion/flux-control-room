import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
    } else if (p.endsWith(".ts") || p.endsWith(".tsx")) {
      out.push(p);
    }
  }
  return out;
}

describe("Flux HTTP boundary", () => {
  it("does not use fetch() under lib/ except lib/flux/client.ts", () => {
    const root = join(process.cwd(), "lib");
    const files = walk(root).filter((f) => !f.includes(".test."));
    for (const file of files) {
      if (file.endsWith(join("flux", "client.ts"))) continue;
      const src = readFileSync(file, "utf8");
      if (src.includes("fetch(")) {
        expect.fail(`Unexpected fetch() in ${file}; use fluxJson from lib/flux/client.ts`);
      }
    }
  });
});
