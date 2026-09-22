import { A as recordExternalBooking, C as markDidNotOccur, F as resolveConflict, I as resolveUnknown, M as rejectRequest, N as releaseBlock, P as reportIncident, _ as createRequest, a as PILOT_NOW, b as hostOwnsVilla, d as advanceTime, f as checkInStay, g as createEmptyWorld, h as createBlock, i as HOLD_MS, j as recordPayment, l as acceptRequest, o as PILOT_SEED, p as checkOutStay, r as DomainError, u as actorFromRole, v as expireHolds, w as markRefundDone } from "./role-CluaTsFs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/world.server-pZkOCyjn.js
var _0002_world_state_default = "-- Shared Stayora World (one JSON row). Auth-off, unowned.\ncreate table if not exists world_state (\n  id int primary key,\n  version int not null,\n  data jsonb not null,\n  updated_at timestamptz not null default now()\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_world_state.sql": _0002_world_state_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var SEED_HOST = { persona: "HOST" };
/** Build the field-test World from data/pilot-seed.json using engine paths. */
function seedFromPilot() {
	let world = createEmptyWorld(PILOT_NOW);
	world = {
		...world,
		sales: PILOT_SEED.sales.map((person) => ({
			id: person.id,
			name: person.name
		})),
		butlers: PILOT_SEED.butlers.map((person) => ({
			id: person.id,
			name: person.name,
			villaIds: person.villaIds
		}))
	};
	for (const stay of PILOT_SEED.existingStays) world = recordExternalBooking(world, {
		villaId: stay.villaId,
		checkIn: stay.checkIn,
		checkOut: stay.checkOut,
		guests: stay.guests,
		source: stay.source,
		guestName: stay.guestName,
		actor: SEED_HOST
	}).world;
	for (const block of PILOT_SEED.blocks) world = createBlock(world, {
		villaId: block.villaId,
		start: block.start,
		end: block.end,
		blockKind: block.kind,
		actor: SEED_HOST
	}).world;
	return world;
}
/**
* Load → run mutator → write with optimistic concurrency.
* If the version changed, reload and rerun once; otherwise CONCURRENT_CHANGE.
*/
async function mutateWorld(io, mutator) {
	const first = await io.load();
	const applied = mutator(first.world);
	if (await io.save(applied.world, first.version)) return {
		...applied,
		version: first.version + 1
	};
	const second = await io.load();
	const retried = mutator(second.world);
	if (await io.save(retried.world, second.version)) return {
		...retried,
		version: second.version + 1
	};
	throw new DomainError("CONCURRENT_CHANGE", "Có người vừa thay đổi — thử lại");
}
function assertHostVilla(role, villaId) {
	if (role.persona !== "HOST") return;
	if (!hostOwnsVilla(role.hostId, villaId)) throw new DomainError("FORBIDDEN", "Villa này không thuộc chủ nhà đang đăng nhập");
}
function villaIdFor(world, action) {
	if ("villaId" in action && typeof action.villaId === "string") return action.villaId;
	if (action.type === "ACCEPT_REQUEST" || action.type === "REJECT_REQUEST") return world.requests.find((item) => item.id === action.requestId)?.villaId;
	if (action.type === "RELEASE_BLOCK") return world.commitments.find((item) => item.id === action.commitmentId)?.villaId;
}
function applyWorldAction(world, action, role) {
	if (action.type === "RESET") {
		if (role.persona !== "ADMIN") throw new DomainError("FORBIDDEN", "Only Stayora vận hành can reset");
		return { world: seedFromPilot() };
	}
	const actor = actorFromRole(role);
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
				actor
			});
			return {
				world: result.world,
				requestId: result.request.id
			};
		}
		case "ACCEPT_REQUEST": {
			const result = acceptRequest(world, {
				requestId: action.requestId,
				actor
			});
			return {
				world: result.world,
				requestId: result.request.id
			};
		}
		case "REJECT_REQUEST": {
			const result = rejectRequest(world, {
				requestId: action.requestId,
				actor
			});
			return {
				world: result.world,
				requestId: result.request.id
			};
		}
		case "RECORD_EXTERNAL": return { world: recordExternalBooking(world, {
			villaId: action.villaId,
			checkIn: action.checkIn,
			checkOut: action.checkOut,
			guests: action.guests,
			source: action.source,
			guestName: action.guestName,
			actor
		}).world };
		case "CREATE_BLOCK": return { world: createBlock(world, {
			villaId: action.villaId,
			start: action.start,
			end: action.end,
			blockKind: action.blockKind,
			note: action.note,
			actor
		}).world };
		case "RELEASE_BLOCK": return { world: releaseBlock(world, {
			commitmentId: action.commitmentId,
			actor
		}).world };
		case "RECORD_PAYMENT": return { world: recordPayment(world, {
			obligationId: action.obligationId,
			outcome: action.outcome,
			actor
		}).world };
		case "RESOLVE_UNKNOWN": return { world: resolveUnknown(world, {
			attemptId: action.attemptId,
			outcome: action.outcome,
			actor
		}).world };
		case "MARK_REFUND": return { world: markRefundDone(world, {
			refundId: action.refundId,
			note: action.note,
			actor
		}).world };
		case "RESOLVE_CONFLICT": return { world: resolveConflict(world, {
			conflictId: action.conflictId,
			keepCommitmentId: action.keepCommitmentId,
			endCommitmentId: action.endCommitmentId,
			reason: action.reason,
			actor
		}).world };
		case "CHECK_IN": return { world: checkInStay(world, {
			stayId: action.stayId,
			actor
		}).world };
		case "CHECK_OUT": return { world: checkOutStay(world, {
			stayId: action.stayId,
			actor
		}).world };
		case "DID_NOT_OCCUR": return { world: markDidNotOccur(world, {
			stayId: action.stayId,
			reason: action.reason,
			actor
		}).world };
		case "REPORT_INCIDENT": return { world: reportIncident(world, {
			stayId: action.stayId,
			note: action.note,
			hasPhoto: action.hasPhoto,
			actor
		}).world };
		case "ADVANCE_TIME": return { world: advanceTime(world, HOLD_MS) };
		default: throw new DomainError("INVALID", "Unknown action");
	}
}
var ROW_ID = 1;
function parseWorld(data) {
	if (typeof data === "string") return JSON.parse(data);
	return data;
}
async function loadRow() {
	const row = (await (await getSql()).query("select id, version, data, updated_at from world_state where id = $1", [ROW_ID]))[0];
	if (!row) return null;
	return {
		world: parseWorld(row.data),
		version: Number(row.version),
		updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date(row.updated_at).toISOString()
	};
}
async function insertSeed() {
	const world = seedFromPilot();
	await (await getSql()).query("insert into world_state (id, version, data, updated_at) values ($1, $2, $3::jsonb, now()) on conflict (id) do nothing", [
		ROW_ID,
		1,
		JSON.stringify(world)
	]);
	const loaded = await loadRow();
	if (loaded) return loaded;
	return {
		world,
		version: 1,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function saveRow(world, expectedVersion) {
	return (await (await getSql()).query("update world_state set version = version + 1, data = $1::jsonb, updated_at = now() where id = $2 and version = $3 returning version", [
		JSON.stringify(world),
		ROW_ID,
		expectedVersion
	])).length > 0;
}
async function readWorld() {
	const current = await loadRow() ?? await insertSeed();
	const expired = expireHolds(current.world);
	if (expired === current.world) return {
		world: current.world,
		version: current.version,
		updatedAt: current.updatedAt
	};
	if (await saveRow(expired, current.version)) return {
		world: expired,
		version: current.version + 1,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	const latest = await loadRow() ?? current;
	return {
		world: latest.world,
		version: latest.version,
		updatedAt: latest.updatedAt
	};
}
async function runWorldAction(action, role) {
	const result = await mutateWorld({
		load: async () => {
			const snap = await readWorld();
			return {
				world: snap.world,
				version: snap.version
			};
		},
		save: saveRow
	}, (world) => applyWorldAction(world, action, role));
	const latest = await loadRow();
	return {
		world: result.world,
		version: result.version,
		updatedAt: latest?.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		requestId: result.requestId
	};
}
//#endregion
export { readWorld, runWorldAction };
