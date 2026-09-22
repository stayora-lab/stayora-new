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
import { fetchWorld, submitWorldAction } from "./world-api.ts";
import type { WorldAction } from "./world-actions.ts";
import { parseVai, ROLE_STORAGE_KEY, type RoleSession } from "./role.ts";

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
  demoMode: boolean;
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
  applyVaiFromUrl: () => RoleSession | null;
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
  hostAccept: (requestId: string) => Promise<void>;
  hostExternal: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    source: ExternalSource;
    guestName?: string;
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
  butlerNoShow: (stayId: string, reason: string) => Promise<void>;
  butlerIncident: (stayId: string, note: string, hasPhoto: boolean) => Promise<void>;
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
      applyVaiFromUrl: () => {
        if (typeof window === "undefined") return null;
        const params = new URLSearchParams(window.location.search);
        if (params.get("demo") === "1") set({ demoMode: true });
        const role = parseVai(params.get("vai"));
        if (role) get().setRole(role);
        return role;
      },
      runAction: async (action) => {
        const result = await submitWorldAction({ data: { action, role: roleOf(get()) } });
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
      hostAccept: async (requestId) => {
        await get().runAction({ type: "ACCEPT_REQUEST", requestId });
      },
      hostExternal: async (input) => {
        await get().runAction({ type: "RECORD_EXTERNAL", ...input });
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
      butlerNoShow: async (stayId, reason) => {
        await get().runAction({ type: "DID_NOT_OCCUR", stayId, reason });
      },
      butlerIncident: async (stayId, note, hasPhoto) => {
        await get().runAction({ type: "REPORT_INCIDENT", stayId, note, hasPhoto });
      },
    }),
    {
      name: ROLE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        persona: state.persona,
        saleId: state.saleId,
        hostId: state.hostId,
        butlerId: state.butlerId,
        demoMode: state.demoMode,
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
