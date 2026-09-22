import { l as butlerPeople, v as hostOwnsVilla } from "./engine-Dt7igvIP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-Df_aib37.js
var HIDDEN = "Khách";
/** Seed/external names: Host of that villa and assigned Butler only. BQL/Sale see "Khách". */
function visibleGuestName(record, role) {
	const name = record.guestName?.trim();
	if (!name) return HIDDEN;
	if (role.persona === "ADMIN") return name;
	if (role.persona === "HOST") return hostOwnsVilla(role.hostId, record.villaId) ? name : HIDDEN;
	if (role.persona === "BUTLER") return butlerPeople.find((person) => person.id === role.butlerId)?.villaIds?.includes(record.villaId) ? name : HIDDEN;
	if (role.persona === "SALE") {
		if (record.origin === "EXTERNAL") return HIDDEN;
		if (record.saleId && record.saleId === role.saleId) return name;
		return HIDDEN;
	}
	return HIDDEN;
}
//#endregion
export { visibleGuestName as t };
