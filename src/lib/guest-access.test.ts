import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { acceptRequest, createEmptyWorld, createRequest, recordPayment } from "./domain/engine.ts";
import type { Actor, World } from "./domain/types.ts";
import {
  openGuestSlice,
  projectWorldForCaller,
  normalizeGuestContact,
} from "./guest-access.ts";
import {
  hashGuestCredential,
  issueGuestCredential,
  requestIdForGuestCredential,
  commitWorldWithCredential,
  type CredentialDb,
} from "./guest-credential.server.ts";
import { guestHandoffUrl } from "./guest-session.ts";

const NOW = "2026-09-22T03:00:00.000Z";
const GUEST: Actor = { persona: "GUEST" };
const SALE: Actor = { persona: "SALE", saleId: "sale-an" };
const HOST: Actor = { persona: "HOST" };
const ADMIN: Actor = { persona: "ADMIN" };

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function ask(extra: { guestName?: string; guestEmail?: string; guestPhone?: string; id?: string; actor?: Actor }) {
  return createRequest(createEmptyWorld(NOW), {
    villaId: "t01",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    guests: 2,
    guestName: extra.guestName ?? "",
    guestEmail: extra.guestEmail,
    guestPhone: extra.guestPhone,
    actor: extra.actor ?? GUEST,
    id: extra.id,
  });
}

function pay(world: World, requestId: string): World {
  const obligation = world.obligations.find((item) => item.requestId === requestId && item.kind === "INITIAL");
  if (!obligation) throw new Error("missing obligation");
  return recordPayment(world, { obligationId: obligation.id, outcome: "SUCCEEDED", actor: ADMIN }).world;
}

async function database(): Promise<CredentialDb> {
  const pg = new PGlite();
  await pg.waitReady;
  const sql = readFileSync(new URL("../../migrations/0008_guest_credential.sql", import.meta.url), "utf8");
  await pg.exec(sql);
  return queryDb(pg);
}

function queryDb(pg: PGlite): CredentialDb {
  return {
    query: async <T>(text: string, params?: unknown[]) => {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
  };
}

async function worldDatabase(seed: World): Promise<PGlite> {
  const pg = new PGlite();
  await pg.waitReady;
  await pg.exec(`
    create table world_state (
      id int primary key,
      version int not null,
      data jsonb not null,
      updated_at timestamptz not null default now()
    );
  `);
  const cred = readFileSync(new URL("../../migrations/0008_guest_credential.sql", import.meta.url), "utf8");
  await pg.exec(cred);
  await pg.query("insert into world_state (id, version, data) values ($1, $2, $3::jsonb)", [
    1,
    1,
    JSON.stringify(seed),
  ]);
  return pg;
}

function txRunner(pg: PGlite, failInsert: boolean) {
  return <T>(fn: (db: CredentialDb) => Promise<T>) =>
    pg.transaction(async (tx) => {
      const db: CredentialDb = {
        query: async <Row>(text: string, params?: unknown[]) => {
          if (failInsert && text.includes("insert into guest_credentials")) {
            throw new Error("connection dropped");
          }
          const result = await tx.query<Row>(text, params);
          return result.rows;
        },
      };
      return fn(db);
    });
}

async function worldRow(pg: PGlite): Promise<{ version: number; text: string }> {
  const rows = await pg.query<{ version: number; data: unknown }>(
    "select version, data from world_state where id = 1",
  );
  const row = rows.rows[0];
  if (!row) throw new Error("missing world");
  const text = typeof row.data === "string" ? row.data : JSON.stringify(row.data);
  return { version: Number(row.version), text };
}

describe("guest minimum contact", () => {
  it("accepts a name with phone and no email", () => {
    const created = ask({ guestName: "  An  ", guestPhone: " 0901000001 " });
    assert.equal(created.request.guestName, "An");
    assert.equal(created.request.guestPhone, "0901000001");
    assert.equal(created.request.guestEmail, undefined);
    assert.equal(created.request.source, "GUEST");
  });

  it("accepts a name with email and no phone", () => {
    const created = ask({ guestName: "Mai", guestEmail: " mai@example.com ", actor: SALE });
    assert.equal(created.request.guestName, "Mai");
    assert.equal(created.request.guestEmail, "mai@example.com");
    assert.equal(created.request.guestPhone, undefined);
    assert.equal(created.request.source, "SALE");
  });

  it("rejects a missing name, a blank contact, and the Khách fallback", () => {
    assert.throws(() => ask({ guestName: "   ", guestEmail: "a@example.com" }), /tên khách/i);
    assert.throws(() => ask({ guestName: "An" }), /email hoặc số điện thoại/i);
    assert.throws(() => ask({ guestName: "An", guestEmail: "   ", guestPhone: "  " }), /email hoặc số điện thoại/i);
    assert.throws(() => ask({ guestName: "Khách", guestEmail: "a@example.com" }), /Khách/);
    assert.throws(() => normalizeGuestContact({ guestName: "Khách", guestPhone: "0901000001" }), /Khách/);
    assert.equal(source("./world-actions.ts").includes('|| "Khách"'), false);
    assert.equal(source("../routes/sale.tsx").includes('guestName.trim() || "Khách"'), false);
  });
});

describe("guest credential boundary", () => {
  it("does not treat a resource id or a matching contact as access", async () => {
    const longId = `req_${"a".repeat(40)}`;
    const created = ask({ id: longId, guestName: "An", guestEmail: "an@example.com" });
    const world = created.world;
    assert.equal(openGuestSlice(world, null, { requestId: longId }), null);
    assert.equal(projectWorldForCaller(world, { persona: "GUEST" }).requests.length, 0);
    assert.equal(projectWorldForCaller(world, { persona: "HOST" }).requests.length, 1);

    const db = await database();
    assert.equal(await requestIdForGuestCredential(db, longId), null);
    assert.equal(await requestIdForGuestCredential(db, "an@example.com"), null);
    assert.equal(await requestIdForGuestCredential(db, ""), null);
    const token = await issueGuestCredential(db, longId);
    assert.notEqual(token, longId);
    assert.equal(token.length >= 32, true);
    const stored = await db.query<{ token_hash: string }>(
      "select token_hash from guest_credentials where request_id = $1",
      [longId],
    );
    assert.equal(stored[0]?.token_hash, hashGuestCredential(token));
    assert.notEqual(stored[0]?.token_hash, token);
    assert.equal(JSON.stringify(created.request).includes(token), false);
    assert.equal(await requestIdForGuestCredential(db, token), longId);
    const slice = openGuestSlice(world, { requestId: longId }, { requestId: longId });
    assert.equal(slice?.request.guestName, "An");
    assert.equal(slice?.request.guestEmail, "an@example.com");
  });

  it("refuses a wrong credential and a credential for another relationship", async () => {
    const first = ask({ id: "req_one", guestName: "An", guestPhone: "0901000001" });
    let world = acceptRequest(first.world, {
      requestId: first.request.id,
      actor: HOST,
      handling: "EXCLUSIVE",
    }).world;
    world = pay(world, first.request.id);
    const second = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      guestName: "Bình",
      guestEmail: "binh@example.com",
      actor: GUEST,
      id: "req_two",
    });
    world = acceptRequest(second.world, {
      requestId: second.request.id,
      actor: HOST,
      handling: "EXCLUSIVE",
    }).world;
    world = pay(world, second.request.id);
    const stayOne = world.stays.find((item) => item.requestId === "req_one");
    const stayTwo = world.stays.find((item) => item.requestId === "req_two");
    assert.ok(stayOne && stayTwo);

    const db = await database();
    const tokenOne = await issueGuestCredential(db, "req_one");
    const tokenTwo = await issueGuestCredential(db, "req_two");
    assert.equal(await requestIdForGuestCredential(db, tokenOne), "req_one");
    assert.equal(await requestIdForGuestCredential(db, `${tokenOne}x`), null);
    assert.equal(await requestIdForGuestCredential(db, tokenTwo), "req_two");

    const own = openGuestSlice(world, { requestId: "req_one" }, { stayId: stayOne.id });
    assert.equal(own?.stay?.id, stayOne.id);
    assert.equal(own?.request.guestPhone, "0901000001");
    assert.equal(openGuestSlice(world, { requestId: "req_one" }, { requestId: "req_two" }), null);
    assert.equal(openGuestSlice(world, { requestId: "req_one" }, { stayId: stayTwo.id }), null);
    assert.equal(openGuestSlice(world, null, { stayId: stayOne.id }), null);
    assert.equal(source("./guest-credential.server.ts").includes("console."), false);
    assert.match(source("./world-api.ts"), /requestIdForGuestCredential/);
    assert.match(source("./world-api.ts"), /projectWorldForCaller/);
    assert.match(source("../routes/requests.$requestId.tsx"), /useGuestSlice/);
    assert.match(source("../routes/your-stay.$stayId.tsx"), /useGuestSlice/);
    assert.equal(source("../routes/requests.$requestId.tsx").includes("world.requests.find"), false);
    assert.equal(source("../routes/your-stay.$stayId.tsx").includes("world.stays.find"), false);
  });
});

describe("credential commit and sale handoff", () => {
  it("rolls the request back when the credential insert fails, then a retry stores one", async () => {
    const created = ask({ id: "req_orphan", guestName: "Mai", guestEmail: "mai@example.com", actor: SALE });
    const pg = await worldDatabase(createEmptyWorld(NOW));
    await assert.rejects(
      () =>
        commitWorldWithCredential(txRunner(pg, true), {
          worldJson: JSON.stringify(created.world),
          expectedVersion: 1,
          requestId: created.request.id,
        }),
      /connection dropped/,
    );
    const rolled = await worldRow(pg);
    assert.equal(rolled.version, 1);
    assert.equal(rolled.text.includes("req_orphan"), false);
    assert.equal((await pg.query("select request_id from guest_credentials")).rows.length, 0);

    const saved = await commitWorldWithCredential(txRunner(pg, false), {
      worldJson: JSON.stringify(created.world),
      expectedVersion: 1,
      requestId: created.request.id,
    });
    assert.equal(saved.saved, true);
    assert.ok(saved.guestCredential);
    assert.notEqual(saved.guestCredential, created.request.id);
    const after = await worldRow(pg);
    assert.equal(after.version, 2);
    assert.equal(after.text.includes("req_orphan"), true);
    const hashes = await pg.query<{ token_hash: string }>("select token_hash from guest_credentials");
    assert.equal(hashes.rows.length, 1);
    assert.equal(hashes.rows[0]?.token_hash, hashGuestCredential(saved.guestCredential));
    const db = queryDb(pg);
    assert.equal(await requestIdForGuestCredential(db, saved.guestCredential), "req_orphan");
    const slice = openGuestSlice(created.world, { requestId: "req_orphan" }, { requestId: "req_orphan" });
    assert.equal(slice?.request.guestName, "Mai");
    assert.equal(slice?.request.source, "SALE");
    assert.equal(projectWorldForCaller(created.world, { persona: "SALE" }).requests.length, 1);
    assert.equal(projectWorldForCaller(created.world, { persona: "GUEST" }).requests.length, 0);
    const url = guestHandoffUrl("https://stayora.example", "req_orphan", saved.guestCredential);
    assert.equal(url, `https://stayora.example/requests/req_orphan#${encodeURIComponent(saved.guestCredential)}`);
    assert.equal(url.includes(`/requests/${saved.guestCredential}`), false);
  });

  it("a sale credential opens the stay the same way, and sale does not keep it", async () => {
    const created = ask({ id: "req_sale", guestName: "Mai", guestPhone: "0901000001", actor: SALE });
    let world = acceptRequest(created.world, {
      requestId: created.request.id,
      actor: HOST,
      handling: "EXCLUSIVE",
    }).world;
    world = pay(world, created.request.id);
    const stay = world.stays.find((item) => item.requestId === "req_sale");
    assert.ok(stay);
    const pg = await worldDatabase(createEmptyWorld(NOW));
    const saved = await commitWorldWithCredential(txRunner(pg, false), {
      worldJson: JSON.stringify(world),
      expectedVersion: 1,
      requestId: "req_sale",
    });
    assert.ok(saved.guestCredential);
    const db = queryDb(pg);
    assert.equal(await requestIdForGuestCredential(db, saved.guestCredential!), "req_sale");
    const slice = openGuestSlice(world, { requestId: "req_sale" }, { stayId: stay.id });
    assert.equal(slice?.stay?.id, stay.id);
    assert.equal(slice?.request.guestPhone, "0901000001");
    assert.equal(openGuestSlice(world, { requestId: "req_sale" }, { requestId: "req_other" }), null);

    const store = source("./store.ts");
    const rememberAt = store.indexOf("rememberGuestCredential(result.requestId");
    assert.equal(rememberAt > 0, true);
    assert.match(store.slice(rememberAt - 200, rememberAt), /persona === "GUEST"/);
    assert.equal(source("./world-api.ts").includes("issueGuestCredential"), false);
    assert.match(source("./world.server.ts"), /commitWorldWithCredential/);
    assert.match(source("../routes/sale.tsx"), /guestHandoffUrl/);
    assert.equal(source("../routes/sale.tsx").includes("rememberGuestCredential"), false);
    assert.match(source("./guest-slice.ts"), /persona === "GUEST"/);
    assert.match(source("./guest-slice.ts"), /stripHashCredential/);
    assert.equal(source("./access.ts").includes("commitWorldWithCredential"), false);
    assert.equal(source("./authorize.ts").includes("guestCredential"), false);
  });
});
