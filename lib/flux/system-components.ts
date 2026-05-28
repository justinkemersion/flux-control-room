import { fluxJson } from "./client";
import type { ComponentStatus, SystemComponentRow } from "./types";

export async function listComponents(sub: string): Promise<SystemComponentRow[]> {
  return fluxJson<SystemComponentRow[]>(
    sub,
    "/system_components?order=component_key.asc",
  );
}

export async function getComponentByKey(
  sub: string,
  componentKey: string,
): Promise<SystemComponentRow | null> {
  const rows = await fluxJson<SystemComponentRow[]>(
    sub,
    `/system_components?component_key=eq.${encodeURIComponent(componentKey)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function upsertComponent(
  sub: string,
  payload: {
    component_key: string;
    label: string;
    status?: ComponentStatus;
    detail?: string | null;
  },
): Promise<SystemComponentRow> {
  const existing = await getComponentByKey(sub, payload.component_key);
  const body = {
    label: payload.label,
    status: payload.status ?? "healthy",
    last_checked_at: new Date().toISOString(),
    detail: payload.detail ?? null,
  };

  if (existing) {
    const rows = await fluxJson<SystemComponentRow[]>(
      sub,
      `/system_components?id=eq.${encodeURIComponent(existing.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(body),
      },
    );
    const row = rows[0];
    if (!row) throw new Error("upsertComponent: empty patch response");
    return row;
  }

  const rows = await fluxJson<SystemComponentRow[]>(sub, "/system_components", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: sub,
      component_key: payload.component_key,
      ...body,
    }),
  });
  const row = rows[0];
  if (!row) throw new Error("upsertComponent: empty post response");
  return row;
}

export async function patchComponent(
  sub: string,
  id: string,
  payload: Partial<{ status: ComponentStatus; detail: string | null }>,
): Promise<SystemComponentRow> {
  const rows = await fluxJson<SystemComponentRow[]>(
    sub,
    `/system_components?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...payload,
        last_checked_at: new Date().toISOString(),
      }),
    },
  );
  const row = rows[0];
  if (!row) throw new Error("patchComponent: empty response");
  return row;
}
