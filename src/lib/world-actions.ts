import {
  acceptRequest,
  advanceTime,
  checkInStay,
  checkOutStay,
  evaluateStayCompletion,
  observeArrival,
  observeDeparture,
  reportPrepared,
  createBlock,
  createRequest,
  DomainError,
  HOLD_MS,
  markDidNotOccur,
  markRefundDone,
  recordExternalBooking,
  recordPayment,
  rejectRequest,
  placeProtectiveHold,
  recordMaintenanceFromHold,
  releaseProtectiveHold,
  releaseBlock,
  reportIncident,
  resolveConflict,
  resolveUnknown,
  type Actor,
  type BlockKind,
  type ExternalSource,
  type PaymentOutcome,
  type World,
} from "./domain/index.ts";
import { hostOwnsVilla } from "./villas.ts";
import { actorFromRole, type RoleSession } from "./role.ts";
import { seedFromPilot } from "./seed-pilot.ts";

export type WorldAction =
  | {
      type: "CREATE_REQUEST";
      villaId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      guestName?: string;
    }
  | { type: "ACCEPT_REQUEST"; requestId: string }
  | { type: "REJECT_REQUEST"; requestId: string }
  | {
      type: "RECORD_EXTERNAL";
      villaId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      source: ExternalSource;
      guestName?: string;
    }
  | {
      type: "CREATE_BLOCK";
      villaId: string;
      start: string;
      end: string;
      blockKind: BlockKind;
      note?: string;
    }
  | { type: "RELEASE_BLOCK"; commitmentId: string }
  | { type: "RECORD_PAYMENT"; obligationId: string; outcome: PaymentOutcome }
  | { type: "RESOLVE_UNKNOWN"; attemptId: string; outcome: "SUCCEEDED" | "FAILED" }
  | { type: "MARK_REFUND"; refundId: string; note: string }
  | {
      type: "RESOLVE_CONFLICT";
      conflictId: string;
      keepCommitmentId: string;
      endCommitmentId: string;
      reason: string;
    }
  | { type: "CHECK_IN"; stayId: string }
  | { type: "CHECK_OUT"; stayId: string }
  | { type: "PREPARE"; stayId: string }
  | { type: "OBSERVE_ARRIVAL"; stayId: string }
  | { type: "OBSERVE_DEPARTURE"; stayId: string }
  | { type: "DID_NOT_OCCUR"; stayId: string; reason: string }
  | { type: "REPORT_INCIDENT"; stayId: string; note: string; hasPhoto: boolean }
  | {
      type: "PLACE_PROTECTIVE_HOLD";
      villaId: string;
      start: string;
      end: string;
      note: string;
      incidentId?: string;
    }
  | { type: "RELEASE_PROTECTIVE_HOLD"; holdId: string }
  | { type: "RECORD_MAINTENANCE_FROM_HOLD"; holdId: string }
  | { type: "ADVANCE_TIME" }
  | { type: "RESET" };

export type ActionResult = {
  world: World;
  requestId?: string;
};

function assertHostVilla(role: RoleSession, villaId: string) {
  if (role.persona !== "HOST") return;
  if (!hostOwnsVilla(role.hostId, villaId)) {
    throw new DomainError("FORBIDDEN", "Villa này không thuộc chủ nhà đang đăng nhập");
  }
}

function villaIdFor(world: World, action: WorldAction): string | undefined {
  if ("villaId" in action && typeof action.villaId === "string") return action.villaId;
  if (action.type === "ACCEPT_REQUEST" || action.type === "REJECT_REQUEST") {
    return world.requests.find((item) => item.id === action.requestId)?.villaId;
  }
  if (action.type === "RELEASE_BLOCK") {
    return world.commitments.find((item) => item.id === action.commitmentId)?.villaId;
  }
  if (action.type === "RELEASE_PROTECTIVE_HOLD" || action.type === "RECORD_MAINTENANCE_FROM_HOLD") {
    return (world.protectiveHolds ?? []).find((item) => item.id === action.holdId)?.villaId;
  }
  if (
    action.type === "CHECK_IN" ||
    action.type === "CHECK_OUT" ||
    action.type === "PREPARE" ||
    action.type === "OBSERVE_ARRIVAL" ||
    action.type === "OBSERVE_DEPARTURE" ||
    action.type === "DID_NOT_OCCUR" ||
    action.type === "REPORT_INCIDENT"
  ) {
    return world.stays.find((item) => item.id === action.stayId)?.villaId;
  }
  return undefined;
}

export function applyWorldAction(
  world: World,
  action: WorldAction,
  role: RoleSession,
): ActionResult {
  if (action.type === "RESET") {
    if (role.persona !== "ADMIN") {
      throw new DomainError("FORBIDDEN", "Only Stayora vận hành can reset");
    }
    return { world: seedFromPilot() };
  }

  const actor: Actor = actorFromRole(role);
  const villaId = villaIdFor(world, action);
  if (role.persona === "HOST" && villaId) assertHostVilla(role, villaId);

  switch (action.type) {
    case "CREATE_REQUEST": {
      const result = createRequest(world, {
        villaId: action.villaId,
        checkIn: action.checkIn,
        checkOut: action.checkOut,
        guests: action.guests,
        guestName: action.guestName?.trim() || "Khách",
        actor,
      });
      return { world: result.world, requestId: result.request.id };
    }
    case "ACCEPT_REQUEST": {
      const result = acceptRequest(world, { requestId: action.requestId, actor });
      return { world: result.world, requestId: result.request.id };
    }
    case "REJECT_REQUEST": {
      const result = rejectRequest(world, { requestId: action.requestId, actor });
      return { world: result.world, requestId: result.request.id };
    }
    case "RECORD_EXTERNAL": {
      const result = recordExternalBooking(world, {
        villaId: action.villaId,
        checkIn: action.checkIn,
        checkOut: action.checkOut,
        guests: action.guests,
        source: action.source,
        guestName: action.guestName,
        actor,
      });
      return { world: result.world };
    }
    case "CREATE_BLOCK": {
      const result = createBlock(world, {
        villaId: action.villaId,
        start: action.start,
        end: action.end,
        blockKind: action.blockKind,
        note: action.note,
        actor,
      });
      return { world: result.world };
    }
    case "RELEASE_BLOCK": {
      const result = releaseBlock(world, { commitmentId: action.commitmentId, actor });
      return { world: result.world };
    }
    case "RECORD_PAYMENT": {
      const result = recordPayment(world, {
        obligationId: action.obligationId,
        outcome: action.outcome,
        actor,
      });
      return { world: result.world };
    }
    case "RESOLVE_UNKNOWN": {
      const result = resolveUnknown(world, {
        attemptId: action.attemptId,
        outcome: action.outcome,
        actor,
      });
      return { world: result.world };
    }
    case "MARK_REFUND": {
      const result = markRefundDone(world, {
        refundId: action.refundId,
        note: action.note,
        actor,
      });
      return { world: result.world };
    }
    case "RESOLVE_CONFLICT": {
      const result = resolveConflict(world, {
        conflictId: action.conflictId,
        keepCommitmentId: action.keepCommitmentId,
        endCommitmentId: action.endCommitmentId,
        reason: action.reason,
        actor,
      });
      return { world: result.world };
    }
    case "CHECK_IN": {
      const result = checkInStay(world, { stayId: action.stayId, actor });
      return { world: result.world };
    }
    case "CHECK_OUT": {
      const checked = checkOutStay(world, { stayId: action.stayId, actor });
      const completed = evaluateStayCompletion(checked.world, {
        stayId: action.stayId,
        actor,
      });
      return { world: completed.world };
    }
    case "PREPARE": {
      const result = reportPrepared(world, { stayId: action.stayId, actor });
      return { world: result.world };
    }
    case "OBSERVE_ARRIVAL": {
      const result = observeArrival(world, { stayId: action.stayId, actor });
      return { world: result.world };
    }
    case "OBSERVE_DEPARTURE": {
      const result = observeDeparture(world, { stayId: action.stayId, actor });
      return { world: result.world };
    }
    case "DID_NOT_OCCUR": {
      const result = markDidNotOccur(world, {
        stayId: action.stayId,
        reason: action.reason,
        actor,
      });
      return { world: result.world };
    }
    case "REPORT_INCIDENT": {
      const result = reportIncident(world, {
        stayId: action.stayId,
        note: action.note,
        hasPhoto: action.hasPhoto,
        actor,
      });
      return { world: result.world };
    }
    case "PLACE_PROTECTIVE_HOLD": {
      const result = placeProtectiveHold(world, {
        villaId: action.villaId,
        start: action.start,
        end: action.end,
        note: action.note,
        incidentId: action.incidentId,
        actor,
      });
      return { world: result.world };
    }
    case "RELEASE_PROTECTIVE_HOLD": {
      const result = releaseProtectiveHold(world, { holdId: action.holdId, actor });
      return { world: result.world };
    }
    case "RECORD_MAINTENANCE_FROM_HOLD": {
      const result = recordMaintenanceFromHold(world, { holdId: action.holdId, actor });
      return { world: result.world };
    }
    case "ADVANCE_TIME":
      return { world: advanceTime(world, HOLD_MS) };
    default:
      throw new DomainError("INVALID", "Unknown action");
  }
}
