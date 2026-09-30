import { createServerFn } from "@tanstack/react-start";
import type { World } from "@/lib/domain";
import type { RoleSession } from "./role.ts";
import type { GuestSlice } from "./guest-access.ts";
import type { WorldAction } from "./world-actions.ts";

export type WorldPayload = {
  world: World;
  version: number;
  updatedAt: string;
};

export type ActionPayload = WorldPayload & { requestId?: string; guestCredential?: string };

export type ActionFailure = { ok: false; code: string; message: string };
export type ActionSuccess = { ok: true } & ActionPayload;
export type ActionResponse = ActionSuccess | ActionFailure;

export const fetchWorld = createServerFn({ method: "POST" })
  .validator((input: { vai?: string; key?: string; grantId?: string | null }) => input ?? {})
  .handler(async ({ data }): Promise<WorldPayload> => {
    const { readWorld } = await import("./world.server.ts");
    const { projectWorldForCaller } = await import("./guest-access.ts");
    const snap = await readWorld();
    const role = await callerRole(data);
    return { ...snap, world: projectWorldForCaller(snap.world, role) };
  });

export const fetchGuestSlice = createServerFn({ method: "POST" })
  .validator((input: { credential?: string | null; requestId?: string | null; stayId?: string | null }) => input)
  .handler(async ({ data }): Promise<{ ok: true; slice: GuestSlice } | { ok: false }> => {
    const { readWorld } = await import("./world.server.ts");
    const { openGuestSlice } = await import("./guest-access.ts");
    const { getSql } = await import("./db.ts");
    const { requestIdForGuestCredential } = await import("./guest-credential.server.ts");
    const requestId = data.credential
      ? await requestIdForGuestCredential(await getSql(), data.credential)
      : null;
    const snap = await readWorld();
    const slice = openGuestSlice(snap.world, requestId ? { requestId } : null, {
      requestId: data.requestId,
      stayId: data.stayId,
    });
    if (!slice) return { ok: false };
    return { ok: true, slice };
  });

export const resolveRole = createServerFn({ method: "POST" })
  .validator((input: { vai?: string; key?: string }) => input)
  .handler(async ({ data }): Promise<RoleSession> => {
    const { authorizeRole } = await import("./authorize.ts");
    return authorizeRole(data.vai, data.key);
  });

export const fetchAdminStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ configured: boolean }> => {
    const { isAdminConfigured } = await import("./authorize.ts");
    return { configured: isAdminConfigured() };
  },
);
export const submitWorldAction = createServerFn({ method: "POST" })
  .validator(
    (input: { action: WorldAction; vai?: string; key?: string; grantId?: string | null }) => input,
  )
  .handler(async ({ data }): Promise<ActionResponse> => {
    const { runWorldAction } = await import("./world.server.ts");
    const { projectWorldForCaller } = await import("./guest-access.ts");
    const role = await callerRole(data);
    try {
      const result = await runWorldAction(data.action, role);
      let guestCredential: string | undefined;
      if (data.action.type === "CREATE_REQUEST" && result.requestId && role.persona === "GUEST") {
        const { getSql } = await import("./db.ts");
        const { issueGuestCredential } = await import("./guest-credential.server.ts");
        guestCredential = await issueGuestCredential(await getSql(), result.requestId);
      }
      return {
        ok: true,
        world: projectWorldForCaller(result.world, role),
        version: result.version,
        updatedAt: result.updatedAt,
        requestId: result.requestId,
        guestCredential,
      };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : "INVALID";
      const message = error instanceof Error ? error.message : "Không thực hiện được";
      return { ok: false, code, message };
    }
  });

async function callerRole(input: { vai?: string | null; key?: string | null; grantId?: string | null }) {
  const { resolveWorkingRole } = await import("./access.ts");
  const { currentDevUser, grantsForUser, demoCookieOn } = await import("./dev-identity.server.ts");
  const user = await currentDevUser();
  const grants = user ? await grantsForUser(user.id) : [];
  return resolveWorkingRole({
    signedIn: Boolean(user),
    grants,
    grantId: input.grantId,
    demo: demoCookieOn(),
    vai: input.vai,
    key: input.key,
  });
}
