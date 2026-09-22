import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/world-api-Apgv6trT.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchWorld_createServerFn_handler = createServerRpc({
	id: "fe933c2de899b2acd5d0d9b63e3f1e4227b462c5a90673b2ad48ed7c428e725f",
	name: "fetchWorld",
	filename: "src/lib/world-api.ts"
}, (opts) => fetchWorld.__executeServer(opts));
var fetchWorld = createServerFn({ method: "GET" }).handler(fetchWorld_createServerFn_handler, async () => {
	const { readWorld } = await import("./world.server-QBPQrjeQ.mjs");
	return readWorld();
});
var resolveRole_createServerFn_handler = createServerRpc({
	id: "578d5fcf4a01b27257ec01c83c94109ebcd59c716ab0f90c75e9fec588185572",
	name: "resolveRole",
	filename: "src/lib/world-api.ts"
}, (opts) => resolveRole.__executeServer(opts));
var resolveRole = createServerFn({ method: "POST" }).validator((input) => input).handler(resolveRole_createServerFn_handler, async ({ data }) => {
	const { authorizeRole } = await import("./authorize-CWjJeZeP.mjs");
	return authorizeRole(data.vai, data.key);
});
var submitWorldAction_createServerFn_handler = createServerRpc({
	id: "90c6ac975556e0e5ae78c7c7aa8ac1e6898cc50f1cbdf8918c8be8ede3fb49ad",
	name: "submitWorldAction",
	filename: "src/lib/world-api.ts"
}, (opts) => submitWorldAction.__executeServer(opts));
var submitWorldAction = createServerFn({ method: "POST" }).validator((input) => input).handler(submitWorldAction_createServerFn_handler, async ({ data }) => {
	const { runWorldAction } = await import("./world.server-QBPQrjeQ.mjs");
	const { authorizeRole } = await import("./authorize-CWjJeZeP.mjs");
	const role = authorizeRole(data.vai, data.key);
	try {
		return {
			ok: true,
			...await runWorldAction(data.action, role)
		};
	} catch (error) {
		return {
			ok: false,
			code: error && typeof error === "object" && "code" in error ? String(error.code) : "INVALID",
			message: error instanceof Error ? error.message : "Không thực hiện được"
		};
	}
});
//#endregion
export { fetchWorld_createServerFn_handler, resolveRole_createServerFn_handler, submitWorldAction_createServerFn_handler };
