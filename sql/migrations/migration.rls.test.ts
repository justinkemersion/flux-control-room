import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const INVARIANT =
  "(current_setting('request.jwt.claims', true)::json->>'sub') = user_id";

const dir = __dirname;
const sqlFiles = readdirSync(dir).filter(
  (f) => f.endsWith(".sql") && !f.includes("grants") && f !== "0003_profiles_flux_api_schema.sql",
);

describe("RLS migrations", () => {
  for (const file of sqlFiles) {
    it(`${file} contains RLS invariant on policies`, () => {
      const sql = readFileSync(join(dir, file), "utf8");
      if (!sql.includes("row level security") && !sql.includes("enable row level security")) {
        return;
      }
      const matches = sql.split(INVARIANT).length - 1;
      expect(matches).toBeGreaterThanOrEqual(4);
    });
  }
});

describe("grants migrations", () => {
  it("0002_profiles_grants grants authenticated on profiles", () => {
    const sql = readFileSync(join(dir, "0002_profiles_grants.sql"), "utf8");
    expect(sql.toLowerCase()).toContain("grant");
    expect(sql.toLowerCase()).toContain("authenticated");
    expect(sql.toLowerCase()).toContain("profiles");
  });

  it("0005_core_grants grants authenticated on core tables", () => {
    const sql = readFileSync(join(dir, "0005_core_grants.sql"), "utf8");
    expect(sql.toLowerCase()).toContain("authenticated");
    expect(sql).toContain("records");
    expect(sql).toContain("activity_events");
  });
});

describe("0003_profiles_flux_api_schema.sql", () => {
  it("uses placeholder schema and RLS invariant", () => {
    const sql = readFileSync(join(dir, "0003_profiles_flux_api_schema.sql"), "utf8");
    expect(sql).toContain("{{FLUX_API_SCHEMA}}");
    expect(sql.split(INVARIANT).length - 1).toBeGreaterThanOrEqual(4);
  });
});
