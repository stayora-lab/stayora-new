import { createServerFn } from "@tanstack/react-start";
import type { AdminRequestView, ApplicantRequestView } from "./hosting-model.ts";

export const submitHostingRequest = createServerFn({ method: "POST" })
  .validator(
    (input: {
      unitIds: string[];
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { submitHostingRequest: submit } = await import("./hosting.server.ts");
    return submit(data);
  });

export const fetchMyHostingRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<ApplicantRequestView[]> => {
    const { myHostingRequests } = await import("./hosting.server.ts");
    return myHostingRequests();
  },
);

export const fetchAdminHostingQueue = createServerFn({ method: "POST" })
  .validator((input: { key?: string | null }) => input)
  .handler(async ({ data }): Promise<AdminRequestView[]> => {
    const { adminHostingQueue } = await import("./hosting.server.ts");
    return adminHostingQueue(data.key);
  });

export const decideAdminHostingUnit = createServerFn({ method: "POST" })
  .validator(
    (input: {
      unitRowId: string;
      outcome: "APPROVED" | "REJECTED";
      reason: string;
      key?: string | null;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { adminDecideHostingUnit } = await import("./hosting.server.ts");
    return adminDecideHostingUnit(data);
  });
