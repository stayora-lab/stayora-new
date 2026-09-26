/**
 * Mobile header is its own row, not a narrowed desktop bar.
 *
 * The place name stays on the page (home hero, villa, sale, host, butler).
 * The header does not repeat "Oceanami · Phước Hải" below the md breakpoint.
 * Desktop keeps that chip, including the district.
 *
 * The demo persona picker is not a Working Context switch. It shows only when
 * demo mode is on and nobody is signed in — the same ?demo=1 gate as role links.
 */

export function showDemoPersonaSwitch(demoMode: boolean, signedIn: boolean): boolean {
  return demoMode && !signedIn;
}
