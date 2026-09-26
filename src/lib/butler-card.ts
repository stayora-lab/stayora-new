import type { Stay } from "./domain/types.ts";

export type BoardLane = "prepare" | "arriving" | "departing" | "inHouse";

export type NextCardAction = {
  id: "observe-arrival" | "check-in" | "observe-departure" | "check-out";
  label: string;
};

/** The one next guest step for this lane. Villa cleaning is not a Stay field. */
export function nextCardAction(stay: Stay, lane: BoardLane): NextCardAction | null {
  if (lane === "prepare" || lane === "inHouse") return null;
  if (lane === "arriving") {
    if (stay.status !== "SCHEDULED") return null;
    if (!stay.arrivalObservedAt) return { id: "observe-arrival", label: "Ghi nhận khách đến" };
    return { id: "check-in", label: "Nhận phòng" };
  }
  if (lane === "departing") {
    if (stay.status !== "CHECKED_IN") return null;
    if (!stay.departureObservedAt) return { id: "observe-departure", label: "Ghi nhận khách đi" };
    return { id: "check-out", label: "Trả phòng" };
  }
  return null;
}

export function cardDate(stay: Stay, lane: BoardLane): { label: string; iso: string } {
  if (lane === "departing") return { label: "Ngày đi", iso: stay.checkOut };
  return { label: "Ngày đến", iso: stay.checkIn };
}
