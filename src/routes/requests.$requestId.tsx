import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { StaySummary } from "@/components/stay-summary";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/lib/store";
import { formatLongDate, guestLabel } from "@/lib/stay";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/requests/$requestId")({
  component: RequestPage,
});

function RequestPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const hydrated = useBookingStore((state) => state.hydrated);
  const request = useBookingStore((state) =>
    state.world.requests.find((item) => item.id === requestId),
  );
  const confirmRequest = useBookingStore((state) => state.confirmRequest);
  const [checking, setChecking] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!request || request.status === "CONFIRMED") return;
    const timer = window.setTimeout(() => setUpdateReady(true), 5000);
    return () => window.clearTimeout(timer);
  }, [request]);

  function applyConfirmation() {
    confirmRequest(requestId);
    setUpdateReady(false);
  }

  function checkForUpdate() {
    setChecking(true);
    window.setTimeout(() => {
      applyConfirmation();
      setChecking(false);
    }, 800);
  }

  if (!hydrated) {
    return <main className="mx-auto max-w-lg px-4 py-24 text-muted">Loading your request…</main>;
  }

  if (!request) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">We can't find that request</h1>
        <p className="mt-3 text-ink-soft">It may have been from another session on this device.</p>
        <Button asChild className="mt-8">
          <Link to="/">Browse Oceanami</Link>
        </Button>
      </main>
    );
  }

  const villa = getVilla(request.villaId);
  if (!villa) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">This stay is no longer listed</h1>
        <Button asChild className="mt-8">
          <Link to="/">Browse Oceanami</Link>
        </Button>
      </main>
    );
  }

  if (request.status === "CONFIRMED") {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-lotus-soft text-lotus">
          <Check className="size-5" />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-wider text-lotus uppercase">
          Confirmed
        </p>
        <h1 className="mt-2 font-serif text-title">Your stay is confirmed</h1>
        <p className="mt-3 text-ink-soft">
          {villa.name} is reserved for {guestLabel(request.guests)}, {formatLongDate(request.checkIn)}{" "}
          to {formatLongDate(request.checkOut)}.
        </p>
        {request.reference ? (
          <p className="mt-4 text-sm text-muted">
            Confirmation <span className="font-medium text-ink">{request.reference}</span>
          </p>
        ) : null}

        <div className="mt-8">
          <StaySummary villa={villa} request={request} />
        </div>

        <div className="mt-8 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
          <p className="font-medium">What happens next</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>Arrival notes will be shared before you travel.</li>
            <li>Open your stay for directions and the villa guide.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() =>
              navigate({
                to: "/your-stay/$stayId",
                params: { stayId: request.stayId ?? request.id },
              })
            }
          >
            Open your stay
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/villas/$villaId" params={{ villaId: villa.id }}>
              Back to the villa
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-cream-deep text-ink">
        <Clock className="size-5" />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-wider text-muted uppercase">
        Request sent
      </p>
      <h1 className="mt-2 font-serif text-title">We've sent your request</h1>
      <p className="mt-3 text-ink-soft">
        Oceanami will review this stay and confirm if {villa.name} can welcome you for these dates.
        You'll see the update here.
      </p>

      {updateReady ? (
        <div className="mt-6 rounded-2xl bg-lotus-soft p-4">
          <p className="font-medium text-lotus-deep">There's an update on your request.</p>
          <Button className="mt-3" onClick={applyConfirmation}>
            See the update
          </Button>
        </div>
      ) : null}

      <div className="mt-8">
        <StaySummary villa={villa} request={request} />
      </div>

      <ol className="mt-8 space-y-4">
        <Step done title="Request sent" body="Oceanami has your dates and guest count." />
        <Step
          current
          title="Waiting for confirmation"
          body="This is not a confirmed stay yet. We'll update this page when it is."
        />
        <Step title="Your stay" body="After confirmation, you can open your stay guide." />
      </ol>

      <div className="mt-10 flex flex-col gap-3">
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          disabled={checking}
          onClick={checkForUpdate}
        >
          {checking ? "Checking…" : "Check for an update"}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/villas/$villaId" params={{ villaId: villa.id }}>
            Back to the villa
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
