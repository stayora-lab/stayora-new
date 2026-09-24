import { createServerFn } from "@tanstack/react-start";
import type { World } from "@/lib/domain";
import type { RoleSession } from "./role.ts";
import type { WorldAction } from "./world-actions.ts";

export type WorldPayload = {
  world: World;
  version: number;
  updatedAt: string;
};

export type ActionPayload = WorldPayload & { requestId?: string };

export type ActionFailure = { ok: false; code: string; message: string };
export type ActionSuccess = { ok: true } & ActionPayload;
export type ActionResponse = ActionSuccess | ActionFailure;

export const fetchWorld = createServerFn({ method: "GET" }).handler(
  async (): Promise<WorldPayload> => {
    const { readWorld } = await import("./world.server.ts");
    return readWorld();
  },
);

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
    const { resolveWorkingRole } = await import("./access.ts");
    const { currentDevUser, grantsForUser, demoCookieOn } = await import(
      "./dev-identity.server.ts"
    );
    const user = await currentDevUser();
    const grants = user ? await grantsForUser(user.id) : [];
    const role = resolveWorkingRole({
      signedIn: Boolean(user),
      grants,
      grantId: data.grantId,
      demo: demoCookieOn(),
      vai: data.vai,
      key: data.key,
    });
    try {
      const result = await runWorldAction(data.action, role);
      return { ok: true, ...result };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : "INVALID";
      const message = error instanceof Error ? error.message : "Không thực hiện được";
      return { ok: false, code, message };
    }
  });
