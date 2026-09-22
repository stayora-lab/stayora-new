import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { Check, Clock } from "lucide-react";
import { StaySummary } from "@/components/stay-summary";
import { Button } from "@/components/ui/button";
import { balanceLine, holdCountdown, obligationSucceeded, paymentPlanLabel } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { formatVnd } from "@/lib/stay";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/requests/$requestId")({
  component: RequestPage,
});

function RequestPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const hydrated = useBookingStore((state) => state.hydrated);
  const world = useBookingStore((state) => state.world);
  const request = world.requests.find((item) => item.id === requestId);
  const booking = world.bookings.find((item) => item.requestId === requestId);
  const stay = booking
    ? world.stays.find((item) => item.id === booking.stayId)
    : undefined;
  const initial = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "INITIAL",
  );
  const balance = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "BALANCE",
  );
  const unknown = world.attempts.find(
    (item) => item.obligationId === initial?.id && item.status === "UNKNOWN",
  );
  const balancePaid = balance ? obligationSucceeded(world, balance.id) : false;

  if (!hydrated) {
    return <main className="mx-auto max-w-lg px-4 py-24 text-muted">Đang mở yêu cầu…</main>;
  }

  if (!request) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Không tìm thấy yêu cầu này</h1>
        <p className="mt-3 text-ink-soft">Có thể đây là phiên khác trên thiết bị này.</p>
        <Button asChild className="mt-8">
          <Link to="/">Xem villa Oceanami</Link>
        </Button>
      </main>
    );
  }

  const villa = getVilla(request.villaId);
  if (!villa) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Villa này không còn được niêm yết</h1>
        <Button asChild className="mt-8">
          <Link to="/">Xem villa Oceanami</Link>
        </Button>
      </main>
    );
  }

  if (booking && stay) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-lotus-soft text-lotus">
          <Check className="size-5" />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-wider text-lotus uppercase">
          Đã xác nhận
        </p>
        <h1 className="mt-2 font-serif text-title">Kỳ nghỉ của bạn đã được xác nhận</h1>
        <p className="mt-3 text-ink-soft">
          {villa.name} đã được giữ cho {request.guests} khách.
        </p>
        <p className="mt-4 text-sm text-muted">
          Mã xác nhận <span className="font-medium text-ink">{booking.reference}</span>
        </p>

        {balance ? (
          <p className={`mt-4 text-sm ${balancePaid ? "text-ink-soft" : "text-lotus-deep"}`}>
            {balanceLine(balance, balancePaid)}
          </p>
        ) : null}

        <div className="mt-8">
          <StaySummary villa={villa} request={request} totalLabel="Tổng kỳ nghỉ" />
        </div>

        <div className="mt-8 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
          <p className="font-medium">Bước tiếp theo</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>Hướng dẫn nhận phòng sẽ được gửi trước ngày đến.</li>
            <li>Mở kỳ nghỉ để xem hướng dẫn villa.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() =>
              navigate({
                to: "/your-stay/$stayId",
                params: { stayId: stay.id },
              })
            }
          >
            Mở kỳ nghỉ
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/villas/$villaId" params={{ villaId: villa.id }}>
              Quay lại villa
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const clock = parseISO(world.now);
  const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);
  const waitingCopy =
    request.status === "EXPIRED"
      ? "Hết thời gian giữ phòng."
      : request.status === "CONFLICTED"
        ? "Villa không còn trống cho ngày này."
        : request.status === "DECLINED"
          ? "Chủ nhà đã từ chối yêu cầu này."
          : request.status === "ACCEPTED"
            ? "Chủ nhà đã giữ chỗ. Đây chưa phải kỳ nghỉ đã xác nhận."
            : "Chủ nhà sẽ xem và phản hồi. Đây chưa phải kỳ nghỉ đã xác nhận.";

  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-cream-deep text-ink">
        <Clock className="size-5" />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-wider text-muted uppercase">
        Đã gửi yêu cầu
      </p>
      <h1 className="mt-2 font-serif text-title">Đã gửi yêu cầu của bạn</h1>
      <p className="mt-3 text-ink-soft">{waitingCopy}</p>

      {unknown ? (
        <div className="mt-6 rounded-2xl bg-lotus-soft p-4">
          <p className="font-medium text-lotus-deep">
            Chưa xác định được kết quả thanh toán. Đừng thanh toán lại.
          </p>
        </div>
      ) : null}

      {request.status === "ACCEPTED" && initial && !unknown ? (
        <div className="mt-6 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            Số tiền cần thanh toán
          </p>
          <p className="mt-2 font-serif text-3xl tabular-nums">{formatVnd(initial.amount)}</p>
          <p className="mt-1 text-sm text-muted">
            {plan}
            {request.holdExpiresAt
              ? ` · giữ còn ${holdCountdown(request.holdExpiresAt, clock)}`
              : ""}
          </p>
          {balance ? (
            <p className="mt-3 text-sm text-lotus-deep">{balanceLine(balance, false)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8">
        <StaySummary villa={villa} request={request} totalLabel="Tổng kỳ nghỉ" />
      </div>

      <ol className="mt-8 space-y-4">
        <Step done title="Đã gửi yêu cầu" body="Chủ nhà đã nhận ngày và số khách." />
        <Step
          current={request.status === "PENDING" || request.status === "ACCEPTED"}
          title="Chờ phản hồi"
          body="Chủ nhà sẽ xem và phản hồi. Đây chưa phải kỳ nghỉ đã xác nhận."
        />
        <Step title="Kỳ nghỉ của bạn" body="Sau khi thanh toán thành công, bạn có thể mở hướng dẫn lưu trú." />
      </ol>

      <div className="mt-10">
        <Button asChild variant="ghost" className="w-full">
          <Link to="/villas/$villaId" params={{ villaId: villa.id }}>
            Quay lại villa
          </Link>
        </Button>
      </div>
    </main>
  );
}

function Step({
  title,
  body,
  done,
  current,
}: {
  title: string;
  body: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-1 size-2.5 shrink-0 rounded-full ${
          done ? "bg-lotus" : current ? "bg-ink" : "bg-sand"
        }`}
      />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted">{body}</p>
      </div>
    </li>
  );
}
