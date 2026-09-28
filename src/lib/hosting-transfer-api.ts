import { createServerFn } from "@tanstack/react-start";
import type { IncomingDesignation, DeskUnit } from "./hosting-transfer-model.ts";

const person = (input: {
  unitId: string;
  recipientIdentityId?: string | null;
  recipientEmail: string;
  recipientName: string;
}) => input;

export const fetchTransferDesk = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ primaryUnits: DeskUnit[]; incoming: IncomingDesignation[] }> => {
    const { transferDesk } = await import("./hosting-transfer.server.ts");
    return transferDesk();
  },
);

export const submitDesignation = createServerFn({ method: "POST" })
  .validator(person)
  .handler(async ({ data }) => {
    const { submitDesignation: submit } = await import("./hosting-transfer.server.ts");
    await submit(data);
    return { ok: true as const };
  });

export const submitCancelDesignation = createServerFn({ method: "POST" })
  .validator((input: { designationId: string }) => input)
  .handler(async ({ data }) => {
    const { submitCancelDesignation: submit } = await import("./hosting-transfer.server.ts");
    await submit(data.designationId);
    return { ok: true as const };
  });

export const submitDeclineDesignation = createServerFn({ method: "POST" })
  .validator((input: { designationId: string }) => input)
  .handler(async ({ data }) => {
    const { submitDeclineDesignation: submit } = await import("./hosting-transfer.server.ts");
    await submit(data.designationId);
    return { ok: true as const };
  });

export const submitAcceptDesignation = createServerFn({ method: "POST" })
  .validator((input: { designationId: string; removeCohostIds?: string[] }) => input)
  .handler(async ({ data }) => {
    const { submitAcceptDesignation: submit } = await import("./hosting-transfer.server.ts");
    await submit(data);
    return { ok: true as const };
  });

export const submitCohostInvite = createServerFn({ method: "POST" })
  .validator(person)
  .handler(async ({ data }) => {
    const { submitCohostInvite: submit } = await import("./hosting-transfer.server.ts");
    await submit(data);
    return { ok: true as const };
  });

export const submitCohostRemove = createServerFn({ method: "POST" })
  .validator((input: { unitId: string; cohostIdentityId: string }) => input)
  .handler(async ({ data }) => {
    const { submitCohostRemove: submit } = await import("./hosting-transfer.server.ts");
    await submit(data);
    return { ok: true as const };
  });

export const searchTransferRecipients = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const { searchTransferRecipients: search } = await import("./hosting-transfer.server.ts");
    return search(data.query);
  });

export const fetchAdminTransferPreview = createServerFn({ method: "POST" })
  .validator((input: { unitId: string; key?: string | null }) => input)
  .handler(async ({ data }) => {
    const { adminTransferPreview } = await import("./hosting-transfer.server.ts");
    return adminTransferPreview(data);
  });

export const submitAdminReplace = createServerFn({ method: "POST" })
  .validator(
    (input: { unitId: string; incomingIdentityId: string; reason: string; key?: string | null }) => input,
  )
  .handler(async ({ data }) => {
    const { submitAdminReplace: submit } = await import("./hosting-transfer.server.ts");
    await submit(data);
    return { ok: true as const };
  });
