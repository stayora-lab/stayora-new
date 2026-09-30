import { createHash, randomBytes } from "node:crypto";

/**
 * PROTOTYPE ASSUMPTION. Opaque bearer for the ADR-P077 access invariant.
 * SRC-36 does not select a token, OTP, password, magic link, or QR.
 * The raw value is returned once. Only the SHA-256 hash is stored.
 * This is not recovery, not verification of the contact, and not a Host or Admin grant.
 *
 * The world row and the hash are written in one transaction supplied by the
 * caller. If the hash insert fails, the world write rolls back with it.
 * A retry is a new commit of a request that was never stored, not a second
 * copy of an orphaned request.
 */

export type CredentialDb = {
  query<T>(text: string, params?: unknown[]): Promise<T[]>;
};

export function newGuestCredential(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashGuestCredential(token) };
}

export function hashGuestCredential(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueGuestCredential(db: CredentialDb, requestId: string): Promise<string> {
  const { token, tokenHash } = newGuestCredential();
  const inserted = await db.query<{ request_id: string }>(
    `insert into guest_credentials (request_id, token_hash)
     values ($1, $2)
     on conflict (request_id) do nothing
     returning request_id`,
    [requestId, tokenHash],
  );
  if (!inserted[0]) {
    throw new Error("Không cấp được quyền truy cập");
  }
  return token;
}

export async function requestIdForGuestCredential(
  db: CredentialDb,
  token: string,
): Promise<string | null> {
  const value = token.trim();
  if (value.length < 32) return null;
  const rows = await db.query<{ request_id: string }>(
    `select request_id from guest_credentials where token_hash = $1`,
    [hashGuestCredential(value)],
  );
  return rows[0]?.request_id ?? null;
}

export async function commitWorldWithCredential(
  run: <T>(fn: (db: CredentialDb) => Promise<T>) => Promise<T>,
  input: { worldJson: string; expectedVersion: number; requestId?: string; rowId?: number },
): Promise<{ saved: boolean; guestCredential?: string }> {
  return run(async (db) => {
    const rows = await db.query<{ version: number }>(
      `update world_state
       set version = version + 1, data = $1::jsonb, updated_at = now()
       where id = $2 and version = $3
       returning version`,
      [input.worldJson, input.rowId ?? 1, input.expectedVersion],
    );
    if (!rows[0]) return { saved: false };
    if (!input.requestId) return { saved: true };
    const guestCredential = await issueGuestCredential(db, input.requestId);
    return { saved: true, guestCredential };
  });
}
