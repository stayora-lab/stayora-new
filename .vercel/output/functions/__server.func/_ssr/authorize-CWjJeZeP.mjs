import { a as parseVai } from "./role-BziMqN6s.mjs";
import { timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/authorize-CWjJeZeP.js
function env(key) {
	return process.env[key]?.trim() || void 0;
}
function expectedAdminKey() {
	return env("ADMIN_KEY") ?? "stayora-thu";
}
function adminKeyMatches(provided) {
	if (!provided) return false;
	const expected = expectedAdminKey();
	if (!expected) return false;
	const a = Buffer.from(provided);
	const b = Buffer.from(expected);
	if (a.length !== b.length) {
		timingSafeEqual(a, a);
		return false;
	}
	return timingSafeEqual(a, b);
}
/**
* Re-derive the role on the server. The client-sent RoleSession is never trusted.
* Wrong or missing admin key → GUEST (fail closed).
*/
function authorizeRole(vai, key) {
	const parsed = parseVai(vai);
	if (!parsed) return { persona: "GUEST" };
	if (parsed.persona === "ADMIN" && !adminKeyMatches(key)) return { persona: "GUEST" };
	return parsed;
}
//#endregion
export { authorizeRole };
