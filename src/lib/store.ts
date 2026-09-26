import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createEmptyWorld,
  DomainError,
  PILOT_NOW,
  type BlockKind,
  type ExternalSource,
  type PaymentOutcome,
  type Persona,
  type World,
} from "@/lib/domain";
import {
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_GUESTS,
} from "@/lib/stay";
import { fetchWorld, resolveRole, submitWorldAction } from "./world-api.ts";
import {
  armDemoSession,
  fetchDevSession,
  signOutDevAccount,
  type DevSessionPayload,
} from "./dev-identity-api.ts";
import type { WorldAction } from "./world-actions.ts";
import { parseVai, ROLE_STORAGE_KEY, workingRoleFromGrants, vaiFor, type RoleSession } from "./role.ts";

export type SearchState = {
  checkIn: string;
  checkOut: string;
  guests: number;
};

type BookingState = {
  hydrated: boolean;
  persona: Persona;
  saleId?: string;
  hostId?: string;
  butlerId?: string;
  adminKey?: string;
  demoMode: boolean;
  identity: DevSessionPayload["user"];
  grants: DevSessionPayload["grants"];
  grantId?: string;
  sessionReady: boolean;
  world: World;
  version: number;
  updatedAt: string | null;
  fetchedAt: string | null;
  search: SearchState;
  saleSearch: SearchState;
  opsDate: string;
  setHydrated: (value: boolean) => void;
  setPersona: (persona: Persona) => void;
  setRole: (role: RoleSession) => void;
  setDemoMode: (value: boolean) => void;
  setSearch: (search: Partial<SearchState>) => void;
  setSaleSearch: (search: Partial<SearchState>) => void;
  setOpsDate: (date: string) => void;
  refreshWorld: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
  selectGrant: (grantId: string) => void;
  signOutIdentity: () => Promise<void>;
  applyVaiFromUrl: () => Promise<RoleSession | null>;
  runAction: (action: WorldAction) => Promise<{ requestId?: string }>;
  advanceDemo: () => Promise<void>;
  resetWorld: () => Promise<void>;
  guestCreateRequest: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => Promise<{ requestId: string }>;
  saleCreateRequest: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestName: string;
  }) => Promise<{ requestId: string }>;
  hostAccept: (requestId: string, handling: "EXCLUSIVE" | "COMPETITIVE") => Promise<void>;
  hostExtendAcceptance: (requestId: string) => Promise<void>;
  hostExternal: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    source: ExternalSource;
    guestName?: string;
  }) => Promise<void>;
  hostRecordFact: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    source: ExternalSource;
    guestName?: string;
    reportId?: string;
  }) => Promise<void>;
  hostEstablishExternal: (factId: string) => Promise<void>;
  submitExternalReport: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    source: ExternalSource;
    guestName?: string;
    note?: string;
  }) => Promise<void>;
  hostCreateBlock: (input: {
    villaId: string;
    start: string;
    end: string;
    blockKind: BlockKind;
    note?: string;
  }) => Promise<void>;
  hostReleaseBlock: (commitmentId: string) => Promise<void>;
  adminRecordPayment: (obligationId: string, outcome: PaymentOutcome) => Promise<void>;
  adminResolveUnknown: (attemptId: string, outcome: "SUCCEEDED" | "FAILED") => Promise<void>;
  adminMarkRefundDone: (refundId: string, note: string) => Promise<void>;
  adminResolveConflict: (input: {
    conflictId: string;
    keepCommitmentId: string;
    endCommitmentId: string;
    reason: string;
  }) => Promise<void>;
  butlerCheckIn: (stayId: string) => Promise<void>;
  butlerCheckOut: (stayId: string) => Promise<void>;
  beginCleaning: (villaId: string) => Promise<void>;
  completeCleaning: (villaId: string) => Promise<void>;
  butlerObserveArrival: (stayId: string) => Promise<void>;
  butlerObserveDeparture: (stayId: string) => Promise<void>;
  butlerNoShow: (stayId: string, reason: string) => Promise<void>;
  butlerIncident: (stayId: string, note: string, hasPhoto: boolean) => Promise<void>;
  reportIncident: (stayId: string, note: string, hasPhoto: boolean) => Promise<void>;
  placeProtectiveHold: (input: {
    villaId: string;
    start: string;
    end: string;
    note: string;
    incidentId?: string;
  }) => Promise<void>;
  releaseProtectiveHold: (holdId: string) => Promise<void>;
  recordMaintenanceFromHold: (holdId: string) => Promise<void>;
};

function roleOf(state: BookingState): RoleSession {
  return {
    persona: state.persona,
    saleId: state.saleId,
    hostId: state.hostId,
    butlerId: state.butlerId,
  };
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      persona: "GUEST",
      demoMode: false,
      identity: null,
      grants: [],
      sessionReady: false,
      world: createEmptyWorld(PILOT_NOW),
      version: 0,
      updatedAt: null,
      fetchedAt: null,
      search: {
        checkIn: DEFAULT_CHECK_IN,
        checkOut: DEFAULT_CHECK_OUT,
        guests: DEFAULT_GUESTS,
      },
      saleSearch: {
        checkIn: "2026-09-25",
        checkOut: "2026-09-28",
        guests: 8,
      },
      opsDate: "2026-09-22",
      setHydrated: (value) => set({ hydrated: value }),
      setPersona: (persona) => set({ persona }),
      setRole: (role) =>
        set({
          persona: role.persona,
          saleId: role.saleId,
          hostId: role.hostId,
          butlerId: role.butlerId,
          adminKey: role.persona === "ADMIN" ? get().adminKey : undefined,
        }),
      setDemoMode: (demoMode) => set({ demoMode }),
      setSearch: (search) =>
        set((state) => ({ search: { ...state.search, ...search } })),
      setSaleSearch: (search) =>
        set((state) => ({ saleSearch: { ...state.saleSearch, ...search } })),
      setOpsDate: (opsDate) => set({ opsDate }),
      refreshWorld: async () => {
        try {
          const payload = await fetchWorld();
          set({
            world: payload.world,
            version: payload.version,
            updatedAt: payload.updatedAt,
            fetchedAt: new Date().toISOString(),
            hydrated: true,
          });
        } catch {
          set({ hydrated: true });
        }
      },
      refreshIdentity: async () => {
        try {
          const session = await fetchDevSession();
          if (!session.user) {
            set({ identity: null, grants: [], grantId: undefined, sessionReady: true });
            return;
          }
          const active = session.grants.filter((grant) => grant.status === "active");
          const current = get().grantId;
          const chosen = active.find((grant) => grant.id === current) ?? active[0];
          if (!chosen) {
            set({
              identity: session.user,
              grants: session.grants,
              grantId: undefined,
              persona: "GUEST",
              saleId: undefined,
              hostId: undefined,
              butlerId: undefined,
              sessionReady: true,
            });
            return;
          }
          const role = workingRoleFromGrants(active, chosen.role);
          set({
            identity: session.user,
            grants: session.grants,
            grantId: chosen.id,
            persona: role.persona,
            saleId: role.saleId,
            hostId: role.hostId,
            butlerId: role.butlerId,
            sessionReady: true,
          });
        } catch {
          set({ identity: null, grants: [], grantId: undefined, sessionReady: true });
        }
      },
      selectGrant: (grantId) => {
        const grant = get().grants.find((item) => item.id === grantId && item.status === "active");
        if (!grant) return;
        const role = workingRoleFromGrants(
          get().grants.filter((item) => item.status === "active"),
          grant.role,
        );
        set({
          grantId,
          persona: role.persona,
          saleId: role.saleId,
          hostId: role.hostId,
          butlerId: role.butlerId,
        });
      },
      signOutIdentity: async () => {
        await signOutDevAccount();
        set({
          identity: null,
          grants: [],
          grantId: undefined,
          persona: "GUEST",
          saleId: undefined,
          hostId: undefined,
          butlerId: undefined,
          sessionReady: true,
        });
      },
      applyVaiFromUrl: async () => {
        if (typeof window === "undefined") return null;
        const params = new URLSearchParams(window.location.search);
        const urlDemo = params.get("demo") === "1";
        if (urlDemo) set({ demoMode: true });
        await get().refreshIdentity();
        const demo = urlDemo || get().demoMode;
        if (demo && !get().identity) await armDemoSession();
        if (get().identity) return roleOf(get());
        if (!demo) {
          if (get().persona !== "GUEST") get().setRole({ persona: "GUEST" });
          return null;
        }
        const vai = params.get("vai");
        const urlKey = params.get("key");
        if (urlKey) sessionStorage.setItem("stayora-admin-key", urlKey);
        const sessionKey =
          urlKey || sessionStorage.getItem("stayora-admin-key") || undefined;
        const role = parseVai(vai);
        if (role?.persona === "ADMIN") {
          const authorized = await resolveRole({ data: { vai: "admin", key: sessionKey } });
          if (authorized.persona !== "ADMIN") {
            sessionStorage.removeItem("stayora-admin-key");
            get().setRole({ persona: "GUEST" });
            return { persona: "GUEST" };
          }
          set({
            persona: "ADMIN",
            adminKey: sessionKey,
            saleId: undefined,
            hostId: undefined,
            butlerId: undefined,
          });
          return { persona: "ADMIN" };
        }
        if (role) {
          get().setRole(role);
          return role;
        }
        if (sessionKey && window.location.pathname.startsWith("/admin")) {
          const authorized = await resolveRole({ data: { vai: "admin", key: sessionKey } });
          if (authorized.persona === "ADMIN") {
            set({ persona: "ADMIN", adminKey: sessionKey });
            return { persona: "ADMIN" };
          }
          sessionStorage.removeItem("stayora-admin-key");
        }
        return null;
      },
      runAction: async (action) => {
        if (get().identity) await get().refreshIdentity();
        const state = get();
        const result = await submitWorldAction({
          data: {
            action,
            vai: state.identity ? undefined : vaiFor(roleOf(state)),
            key: state.adminKey,
            grantId: state.grantId,
          },
        });
        if (!result.ok) {
          throw new DomainError(result.code, result.message);
        }
        set({
          world: result.world,
          version: result.version,
          updatedAt: result.updatedAt,
          fetchedAt: new Date().toISOString(),
        });
        return { requestId: result.requestId };
      },
      advanceDemo: async () => {
        await get().runAction({ type: "ADVANCE_TIME" });
      },
      resetWorld: async () => {
        await get().runAction({ type: "RESET" });
      },
      guestCreateRequest: async (input) => {
        const result = await get().runAction({ type: "CREATE_REQUEST", ...input, guestName: "Khách" });
        if (!result.requestId) throw new DomainError("INVALID", "Không tạo được yêu cầu");
        return { requestId: result.requestId };
      },
      saleCreateRequest: async (input) => {
        const result = await get().runAction({ type: "CREATE_REQUEST", ...input });
        if (!result.requestId) throw new DomainError("INVALID", "Không tạo được yêu cầu");
        return { requestId: result.requestId };
      },
      hostAccept: async (requestId, handling) => {
        await get().runAction({ type: "ACCEPT_REQUEST", requestId, handling });
      },
      hostExtendAcceptance: async (requestId) => {
        await get().runAction({ type: "EXTEND_ACCEPTANCE", requestId });
      },
      hostExternal: async (input) => {
        await get().runAction({ type: "RECORD_EXTERNAL", ...input });
      },
      hostRecordFact: async (input) => {
        await get().runAction({ type: "RECORD_EXTERNAL_FACT", ...input });
      },
      hostEstablishExternal: async (factId) => {
        await get().runAction({ type: "ESTABLISH_EXTERNAL", factId });
      },
      submitExternalReport: async (input) => {
        await get().runAction({ type: "SUBMIT_EXTERNAL_REPORT", ...input });
      },
      hostCreateBlock: async (input) => {
        await get().runAction({ type: "CREATE_BLOCK", ...input });
      },
      hostReleaseBlock: async (commitmentId) => {
        await get().runAction({ type: "RELEASE_BLOCK", commitmentId });
      },
      adminRecordPayment: async (obligationId, outcome) => {
        await get().runAction({ type: "RECORD_PAYMENT", obligationId, outcome });
      },
      adminResolveUnknown: async (attemptId, outcome) => {
        await get().runAction({ type: "RESOLVE_UNKNOWN", attemptId, outcome });
      },
      adminMarkRefundDone: async (refundId, note) => {
        await get().runAction({ type: "MARK_REFUND", refundId, note });
      },
      adminResolveConflict: async (input) => {
        await get().runAction({ type: "RESOLVE_CONFLICT", ...input });
      },
      butlerCheckIn: async (stayId) => {
        await get().runAction({ type: "CHECK_IN", stayId });
      },
      butlerCheckOut: async (stayId) => {
        await get().runAction({ type: "CHECK_OUT", stayId });
      },
      beginCleaning: async (villaId) => {
        await get().runAction({ type: "BEGIN_CLEANING", villaId });
      },
      completeCleaning: async (villaId) => {
        await get().runAction({ type: "COMPLETE_CLEANING", villaId });
      },
      butlerObserveArrival: async (stayId) => {
        await get().runAction({ type: "OBSERVE_ARRIVAL", stayId });
      },
      butlerObserveDeparture: async (stayId) => {
        await get().runAction({ type: "OBSERVE_DEPARTURE", stayId });
      },
      butlerNoShow: async (stayId, reason) => {
        await get().runAction({ type: "DID_NOT_OCCUR", stayId, reason });
      },
      butlerIncident: async (stayId, note, hasPhoto) => {
        await get().runAction({ type: "REPORT_INCIDENT", stayId, note, hasPhoto });
      },
      reportIncident: async (stayId, note, hasPhoto) => {
        await get().runAction({ type: "REPORT_INCIDENT", stayId, note, hasPhoto });
      },
      placeProtectiveHold: async (input) => {
        await get().runAction({ type: "PLACE_PROTECTIVE_HOLD", ...input });
      },
      releaseProtectiveHold: async (holdId) => {
        await get().runAction({ type: "RELEASE_PROTECTIVE_HOLD", holdId });
      },
      recordMaintenanceFromHold: async (holdId) => {
        await get().runAction({ type: "RECORD_MAINTENANCE_FROM_HOLD", holdId });
      },
    }),
    {
      name: ROLE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        persona: state.persona === "ADMIN" ? "GUEST" : state.persona,
        saleId: state.saleId,
        hostId: state.hostId,
        butlerId: state.butlerId,
        demoMode: state.demoMode,
        grantId: state.grantId,
        search: state.search,
        saleSearch: state.saleSearch,
        opsDate: state.opsDate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function useLatestGuestRequest() {
  return useBookingStore((state) =>
    state.world.requests.find((item) => item.source === "GUEST"),
  );
}

export { DomainError };
