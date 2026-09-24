import { env } from "./env.server.ts";

/** Server-only. Unset means off. Never a VITE_ variable. */
export const DEV_SIGN_IN_ENV = "DEV_SIGN_IN";

export function devSignInEnabled(
  raw: string | null | undefined = env(DEV_SIGN_IN_ENV),
): boolean {
  const value = raw?.trim().toLowerCase();
  return value === "1" || value === "true";
}

export function assertDevSignInEnabled(): void {
  if (!devSignInEnabled()) {
    throw Object.assign(new Error("Đăng nhập thử đang tắt"), { code: "DEV_SIGN_IN_OFF" });
  }
}
