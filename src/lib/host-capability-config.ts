/**
 * Host actions this prototype already allows that sit outside the four
 * standard V0 Primary Host families: Booking, Inventory, Primary-only
 * Delegation, and Villa Readiness Host-support.
 *
 * Each entry is a PROTOTYPE ASSUMPTION beyond the canonical standard set
 * (ADR-P075). This slice does not extend or remove them.
 */
export const HOST_ACTIONS_BEYOND_STANDARD_SET = [
  {
    id: "protective-hold-place",
    label: "Giữ bảo vệ",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "protective-hold-release",
    label: "Gỡ giữ bảo vệ",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "maintenance-from-hold",
    label: "Ghi bảo trì từ giữ bảo vệ",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "maintenance-block",
    label: "Chặn lịch loại Bảo trì",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "payment-status-lines",
    label: "Dòng trạng thái thanh toán trên yêu cầu",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "balance-due-lines",
    label: "Khoản còn lại sắp đến hạn",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "request-price-line",
    label: "Giá và kế hoạch thanh toán trên thẻ yêu cầu",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
  {
    id: "report-incident",
    label: "Báo việc trên lưu trú",
    assumption: "PROTOTYPE ASSUMPTION beyond the canonical standard set",
  },
] as const;
