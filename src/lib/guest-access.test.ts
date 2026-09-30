import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { acceptRequest, createEmptyWorld, createRequest, recordPayment } from "./domain/engine.ts";
import { isAvailable } from "./domain/availability.ts";
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
    assert.equal(projectWorldForCaller(world, { persona: "HOST" }).requests.length, 0);
    assert.equal(
      projectWorldForCaller(world, { persona: "HOST", hostId: "host-an" }).requests.length,
      1,
    );

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
    assert.equal(projectWorldForCaller(created.world, { persona: "SALE" }).requests.length, 0);
    assert.equal(
      projectWorldForCaller(created.world, { persona: "SALE", saleId: "sale-an" }).requests.length,
      1,
    );
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

function commercialPayload(world: World): string {
  return JSON.stringify({
    requests: world.requests,
    bookings: world.bookings,
    stays: world.stays,
    commissions: world.commissions,
    obligations: world.obligations,
    attempts: world.attempts,
    refundCases: world.refundCases,
    commitments: world.commitments,
    incidents: world.incidents,
    protectiveHolds: world.protectiveHolds,
    externalAccommodations: world.externalAccommodations,
    conflicts: world.conflicts,
    auditLog: world.auditLog,
    checkoutAssessments: world.checkoutAssessments,
    readinessNotes: world.readinessNotes,
  });
}

describe("operational world scope", () => {
  function bookedPair(): World {
    let world = createEmptyWorld(NOW);
    world = createRequest(world, {
      villaId: "t01",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Mai",
      guestEmail: "mai@example.com",
      guestPhone: "0901000001",
      actor: SALE,
      id: "req_an",
    }).world;
    world = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-14",
      guests: 3,
      guestName: "Bình",
      guestEmail: "binh@example.com",
      guestPhone: "0902000002",
      actor: { persona: "SALE", saleId: "sale-binh" },
      id: "req_binh",
    }).world;
    world = acceptRequest(world, {
      requestId: "req_an",
      actor: HOST,
      handling: "EXCLUSIVE",
    }).world;
    world = acceptRequest(world, {
      requestId: "req_binh",
      actor: HOST,
      handling: "EXCLUSIVE",
    }).world;
    world = pay(world, "req_an");
    world = pay(world, "req_binh");
    world = {
      ...world,
      commitments: world.commitments.map((item) =>
        item.villaId === "t04" && item.status === "ACTIVE" ? { ...item, note: "ghi chú Bình" } : item,
      ),
      protectiveHolds: [
        ...world.protectiveHolds,
        {
          id: "hold_t04",
          villaId: "t04",
          start: "2026-12-20",
          end: "2026-12-22",
          note: "Bình bị rò điện",
          status: "ACTIVE",
          createdAt: NOW,
          createdBy: "HOST",
          reviewDueAt: "2026-12-21T00:00:00.000Z",
        },
      ],
      externalAccommodations: [
        {
          id: "ext_t01",
          villaId: "t01",
          checkIn: "2026-11-01",
          checkOut: "2026-11-03",
          guests: 2,
          guestName: "Khách Mai",
          source: "Airbnb",
        },
        {
          id: "ext_t04",
          villaId: "t04",
          checkIn: "2026-11-04",
          checkOut: "2026-11-06",
          guests: 2,
          guestName: "Khách Bình",
          source: "Zalo",
        },
      ],
      incidents: [
        {
          id: "inc_t04",
          stayId: world.stays.find((item) => item.villaId === "t04")?.id ?? "sty_missing",
          villaId: "t04",
          note: "hỏng điều hòa của Bình",
          hasPhoto: false,
          createdAt: NOW,
          createdBy: "HOST",
        },
      ],
    };
    return world;
  }

  it("keeps another sale's requests, commissions and guest contact out of the payload", () => {
    const world = bookedPair();
    const mine = projectWorldForCaller(world, { persona: "SALE", saleId: "sale-an" });
    const raw = commercialPayload(mine);
    assert.deepEqual(
      mine.requests.map((item) => item.id),
      ["req_an"],
    );
    assert.equal(mine.requests[0]?.guestEmail, "mai@example.com");
    assert.equal(mine.requests[0]?.guestPhone, "0901000001");
    assert.equal(mine.bookings.every((item) => item.saleId === "sale-an"), true);
    assert.equal(mine.bookings.length, 1);
    assert.equal(mine.stays.every((item) => item.requestId === "req_an"), true);
    assert.equal(mine.commissions.every((item) => item.saleId === "sale-an"), true);
    assert.equal(mine.commissions.length, 1);
    assert.equal(mine.obligations.every((item) => item.requestId === "req_an"), true);
    assert.equal(raw.includes("sale-binh"), false);
    assert.equal(raw.includes("binh@example.com"), false);
    assert.equal(raw.includes("0902000002"), false);
    assert.equal(raw.includes("Bình"), false);
    assert.equal(raw.includes("Khách Bình"), false);
    const otherDates = mine.commitments.find((item) => item.villaId === "t04");
    assert.ok(otherDates);
    assert.equal(otherDates.requestId, undefined);
    assert.equal(otherDates.bookingId, undefined);
    assert.equal(otherDates.stayId, undefined);
    assert.equal(otherDates.note, undefined);
    assert.equal(isAvailable(mine, "t04", "2026-12-10", "2026-12-14"), false);
    const otherHold = mine.protectiveHolds.find((item) => item.villaId === "t04");
    assert.equal(otherHold?.note, "");
    assert.equal(mine.externalAccommodations.every((item) => item.guestName === undefined), true);
    assert.equal(mine.incidents.length, 0);

    const none = projectWorldForCaller(world, { persona: "SALE" });
    const empty = commercialPayload(none);
    assert.equal(none.requests.length, 0);
    assert.equal(none.bookings.length, 0);
    assert.equal(none.commissions.length, 0);
    assert.equal(empty.includes("mai@example.com"), false);
    assert.equal(empty.includes("binh@example.com"), false);
    assert.equal(empty.includes("sale-binh"), false);
  });

  it("keeps another host's villa records out of the payload", () => {
    const world = bookedPair();
    const an = projectWorldForCaller(world, { persona: "HOST", hostId: "host-an" });
    const anRaw = commercialPayload(an);
    assert.deepEqual(
      an.requests.map((item) => item.villaId),
      ["t01"],
    );
    assert.equal(an.requests[0]?.guestEmail, "mai@example.com");
    assert.equal(an.bookings.every((item) => item.villaId === "t01"), true);
    assert.equal(an.stays.every((item) => item.villaId === "t01"), true);
    assert.equal(an.commitments.every((item) => item.villaId === "t01"), true);
    assert.equal(an.obligations.every((item) => item.requestId === "req_an"), true);
    assert.equal(an.commissions.every((item) => item.saleId === "sale-an"), true);
    assert.equal(an.externalAccommodations.map((item) => item.guestName).join(), "Khách Mai");
    assert.equal(an.incidents.length, 0);
    assert.equal(an.protectiveHolds.every((item) => item.villaId === "t01"), true);
    assert.equal(anRaw.includes("t04"), false);
    assert.equal(anRaw.includes("sale-binh"), false);
    assert.equal(anRaw.includes("binh@example.com"), false);
    assert.equal(anRaw.includes("0902000002"), false);
    assert.equal(anRaw.includes("Bình"), false);
    assert.ok(an.commitments.some((item) => item.requestId === "req_an" && item.bookingId));

    const cohost = projectWorldForCaller(world, { persona: "HOST", villaIds: ["t04"] });
    assert.deepEqual(
      cohost.requests.map((item) => item.id),
      ["req_binh"],
    );
    assert.equal(cohost.requests[0]?.guestPhone, "0902000002");
    assert.equal(cohost.commitments.some((item) => item.note === "ghi chú Bình"), true);
    assert.equal(cohost.protectiveHolds.some((item) => item.note === "Bình bị rò điện"), true);
    assert.equal(commercialPayload(cohost).includes("mai@example.com"), false);
    assert.equal(commercialPayload(cohost).includes("t01"), false);

    const both = projectWorldForCaller(world, {
      persona: "HOST",
      hostId: "host-an",
      villaIds: ["t04"],
    });
    assert.equal(both.requests.length, 2);

    const bare = projectWorldForCaller(world, { persona: "HOST" });
    assert.equal(bare.requests.length, 0);
    assert.equal(bare.bookings.length, 0);
    assert.equal(bare.stays.length, 0);
    assert.equal(bare.obligations.length, 0);
    assert.equal(commercialPayload(bare).includes("mai@example.com"), false);
    assert.equal(commercialPayload(bare).includes("binh@example.com"), false);

    assert.equal(projectWorldForCaller(world, { persona: "BQL" }).requests.length, 2);
    assert.equal(projectWorldForCaller(world, { persona: "BUTLER" }).requests.length, 2);
    assert.equal(projectWorldForCaller(world, { persona: "ADMIN" }).requests.length, 2);
    const guest = projectWorldForCaller(world, { persona: "GUEST" });
    assert.equal(guest.requests.length, 0);
    assert.equal(commercialPayload(guest).includes("mai@example.com"), false);
    assert.equal(commercialPayload(guest).includes("binh@example.com"), false);
    assert.equal(
      guest.commitments.every((item) => item.requestId === undefined && item.note === undefined),
      true,
    );
  });
});
