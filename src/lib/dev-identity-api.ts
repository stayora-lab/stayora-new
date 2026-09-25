import { createServerFn } from "@tanstack/react-start";
import type { DevGrantRow, DevUser } from "./dev-types.ts";

export type DevSessionPayload = {
  user: DevUser | null;
  grants: DevGrantRow[];
};

export const fetchDevSignInGate = createServerFn({ method: "GET" }).handler(async () => {
  const { readDevSignInGate } = await import("./dev-identity.server.ts");
  return readDevSignInGate();
});

export const fetchDevSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<DevSessionPayload> => {
    const { currentDevUser, grantsForUser } = await import("./dev-identity.server.ts");
    const user = await currentDevUser();
    if (!user) return { user: null, grants: [] };
    return { user, grants: await grantsForUser(user.id) };
  },
);

export const signInAccount = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data }): Promise<DevSessionPayload> => {
    const { signInIdentity, grantsForUser } = await import("./dev-identity.server.ts");
    const user = await signInIdentity(data.email, data.password);
    return { user, grants: await grantsForUser(user.id) };
  });

export const signUpAccount = createServerFn({ method: "POST" })
  .validator((input: { name: string; email: string; password: string }) => input)
  .handler(async ({ data }): Promise<DevSessionPayload> => {
    const { signUpIdentity, grantsForUser } = await import("./dev-identity.server.ts");
    const user = await signUpIdentity(data);
    return { user, grants: await grantsForUser(user.id) };
  });

export const signInDevAccount = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data }): Promise<DevSessionPayload> => {
    const { signInDev, grantsForUser } = await import("./dev-identity.server.ts");
    const user = await signInDev(data.email, data.password);
    return { user, grants: await grantsForUser(user.id) };
  });

export const signUpDevAccount = createServerFn({ method: "POST" })
  .validator((input: { name: string; email: string; password: string }) => input)
  .handler(async ({ data }): Promise<DevSessionPayload> => {
    const { signUpDev, grantsForUser } = await import("./dev-identity.server.ts");
    const user = await signUpDev(data);
    return { user, grants: await grantsForUser(user.id) };
  });

export const signOutDevAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { signOutDev } = await import("./dev-identity.server.ts");
  await signOutDev();
  return { ok: true as const };
});

export const armDemoSession = createServerFn({ method: "POST" }).handler(async () => {
  const { armDemoCookie } = await import("./dev-identity.server.ts");
  armDemoCookie();
  return { ok: true as const };
});

export const fetchDevDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { rolesPageDirectory } = await import("./dev-identity.server.ts");
  return rolesPageDirectory();
});

export const lookupAccountGrants = createServerFn({ method: "POST" })
  .validator((input: { email: string; key?: string | null }) => input)
  .handler(async ({ data }) => {
    const { accountGrantsForOperator } = await import("./dev-identity.server.ts");
    return accountGrantsForOperator(data.email, data.key);
  });

export const adminGrantRole = createServerFn({ method: "POST" })
  .validator(
    (input: { email: string; role: string; villaIds?: string[]; key?: string | null }) =>
      input,
  )
  .handler(async ({ data }) => {
    const { grantRole } = await import("./dev-identity.server.ts");
    await grantRole(data);
    return { ok: true as const };
  });

export const adminRevokeRole = createServerFn({ method: "POST" })
  .validator((input: { grantId: string; key?: string | null }) => input)
  .handler(async ({ data }) => {
    const { revokeRole } = await import("./dev-identity.server.ts");
    await revokeRole(data.grantId, data.key);
    return { ok: true as const };
  });
