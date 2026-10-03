import { useEffect, useState } from "react";
import type { GuestSlice } from "./guest-access.ts";
import { readGuestCredential, rememberGuestCredential } from "./guest-session.ts";
import { fetchGuestSlice } from "./world-api.ts";

export function useGuestSlice(query: { requestId?: string; stayId?: string }): {
  state: "loading" | "denied" | "closed" | "ready";
  slice: GuestSlice | null;
  access: "live" | "read-only" | null;
} {
  const requestId = query.requestId;
  const stayId = query.stayId;
  const [state, setState] = useState<"loading" | "denied" | "closed" | "ready">("loading");
  const [slice, setSlice] = useState<GuestSlice | null>(null);
  const [access, setAccess] = useState<"live" | "read-only" | null>(null);

  useEffect(() => {
    const resourceId = requestId ?? stayId;
    const credential = resourceId ? readGuestCredential(resourceId) : null;
    if (!credential) {
      setSlice(null);
      setAccess(null);
      setState("denied");
      return;
    }
    let cancelled = false;
    setState("loading");
    void fetchGuestSlice({ data: { credential, requestId, stayId } })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setSlice(null);
          setAccess(null);
          setState(result.reason === "post-stay" ? "closed" : "denied");
          return;
        }
        rememberGuestCredential(result.slice.request.id, credential);
        if (result.slice.stay) rememberGuestCredential(result.slice.stay.id, credential);
        setSlice(result.slice);
        setAccess(result.access);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setSlice(null);
          setAccess(null);
          setState("denied");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, stayId]);

  return { state, slice, access };
}
