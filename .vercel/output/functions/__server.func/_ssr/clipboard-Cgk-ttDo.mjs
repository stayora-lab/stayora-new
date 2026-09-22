//#region node_modules/.nitro/vite/services/ssr/assets/clipboard-Cgk-ttDo.js
async function copyText(value) {
	try {
		await navigator.clipboard.writeText(value);
		return true;
	} catch {
		try {
			const area = document.createElement("textarea");
			area.value = value;
			area.setAttribute("readonly", "");
			area.style.position = "fixed";
			area.style.left = "-9999px";
			document.body.appendChild(area);
			area.select();
			const ok = document.execCommand("copy");
			document.body.removeChild(area);
			return ok;
		} catch {
			return false;
		}
	}
}
//#endregion
export { copyText as t };
