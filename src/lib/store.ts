import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  acceptRequest,
  BUTLER_LINH,
  checkInStay,
  checkOutStay,
  confirmGuestRequest,
  confirmRequest,
  createRequest,
  DomainError,
  markDidNotOccur,
  reportIncident,
  SALE_MAI,
  seedWorld,
  type Actor,
  type Persona,
  type World,
} from "@/lib/domain";
import {
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_GUESTS,
} from "@/lib/stay";

export type SearchState = {
  checkIn: string;
  checkOut: string;
  guests: number;
};

type BookingState = {
  hydrated: boolean;
  persona: Persona;
  world: World;
  search: SearchState;
  saleSearch: SearchState;
  opsDate: string;
  setHydrated: (value: boolean) => void;
  setPersona: (persona: Persona) => void;
  setSearch: (search: Partial<SearchState>) => void;
  setSaleSearch: (search: Partial<SearchState>) => void;
  setOpsDate: (date: string) => void;
  guestCreateRequest: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => { requestId: string };
  saleCreateRequest: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestName: string;
  }) => { requestId: string };
  hostAccept: (requestId: string) => void;
  hostConfirm: (requestId: string) => void;
  confirmRequest: (requestId: string) => void;
  butlerCheckIn: (stayId: string) => void;
  butlerCheckOut: (stayId: string) => void;
  butlerNoShow: (stayId: string, reason: string) => void;
  butlerIncident: (stayId: string, note: string, hasPhoto: boolean) => void;
};

function actorFor(persona: Persona): Actor {
  if (persona === "SALE") return { persona: "SALE", saleId: SALE_MAI };
  if (persona === "BUTLER") return { persona: "BUTLER", butlerId: BUTLER_LINH };
  if (persona === "HOST") return { persona: "HOST" };
  if (persona === "BQL") return { persona: "BQL" };
  return { persona: "GUEST" };
}

function withNow(world: World): World {
  return { ...world, now: new Date().toISOString() };
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      persona: "GUEST",
      world: seedWorld(),
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
      setSearch: (search) =>
        set((state) => ({ search: { ...state.search, ...search } })),
      setSaleSearch: (search) =>
        set((state) => ({ saleSearch: { ...state.saleSearch, ...search } })),
      setOpsDate: (opsDate) => set({ opsDate }),
      guestCreateRequest: (input) => {
        const result = createRequest(withNow(get().world), {
          ...input,
          guestName: "Khách",
          actor: { persona: "GUEST" },
        });
        set({ world: result.world });
        return { requestId: result.request.id };
      },
      saleCreateRequest: (input) => {
        const result = createRequest(withNow(get().world), {
          ...input,
          actor: { persona: "SALE", saleId: SALE_MAI },
        });
        set({ world: result.world });
        return { requestId: result.request.id };
      },
      hostAccept: (requestId) => {
        const result = acceptRequest(withNow(get().world), {
          requestId,
          actor: { persona: "HOST" },
        });
        set({ world: result.world });
      },
      hostConfirm: (requestId) => {
        const result = confirmRequest(withNow(get().world), {
          requestId,
          actor: { persona: "HOST" },
        });
        set({ world: result.world });
      },
      confirmRequest: (requestId) => {
        const result = confirmGuestRequest(withNow(get().world), requestId);
        set({ world: result.world });
      },
      butlerCheckIn: (stayId) => {
        const result = checkInStay(withNow(get().world), {
          stayId,
          actor: { persona: "BUTLER", butlerId: BUTLER_LINH },
        });
        set({ world: result.world });
      },
      butlerCheckOut: (stayId) => {
        const result = checkOutStay(withNow(get().world), {
          stayId,
          actor: { persona: "BUTLER", butlerId: BUTLER_LINH },
        });
        set({ world: result.world });
      },
      butlerNoShow: (stayId, reason) => {
        const result = markDidNotOccur(withNow(get().world), {
          stayId,
          actor: { persona: "BUTLER", butlerId: BUTLER_LINH },
          reason,
        });
        set({ world: result.world });
      },
      butlerIncident: (stayId, note, hasPhoto) => {
        const result = reportIncident(withNow(get().world), {
          stayId,
          actor: { persona: "BUTLER", butlerId: BUTLER_LINH },
          note,
          hasPhoto,
        });
        set({ world: result.world });
      },
    }),
    {
      name: "stayora-phase3",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        persona: state.persona,
        world: state.world,
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

export { actorFor, DomainError, SALE_MAI, BUTLER_LINH };
