/**
 * Real identity versus the fictional pilot accounts.
 * Creating an identity never reads DEV_SIGN_IN and never writes a role.
 */

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isFictionalPilotEmail(email: string, pilotEmails: readonly string[]): boolean {
  const normalized = normalizeAccountEmail(email);
  if (!normalized) return false;
  return pilotEmails.some((item) => normalizeAccountEmail(item) === normalized);
}

const REAL_ACCOUNT_FIELDS = "Email, tên và mật khẩu (tối thiểu 8 ký tự) là bắt buộc";

export function assertRealAccountFields(input: {
  name: string;
  email: string;
  password: string;
}): void {
  if (!input.name || !input.email.includes("@") || input.password.length < 8) {
    throw new Error(REAL_ACCOUNT_FIELDS);
  }
}

export type IdentityInsert = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
};

export async function createRealIdentity(
  deps: {
    findByEmail: (email: string) => Promise<{ id: string } | null>;
    insertIdentity: (row: IdentityInsert) => Promise<void>;
    hashPassword: (password: string) => string;
    newId: () => string;
  },
  input: {
    name: string;
    email: string;
    password: string;
    pilotEmails: readonly string[];
  },
): Promise<{ id: string; email: string; name: string }> {
  const email = normalizeAccountEmail(input.email);
  const name = input.name.trim();
  if (isFictionalPilotEmail(email, input.pilotEmails)) {
    throw new Error("Email này dành cho tài khoản thử");
  }
  assertRealAccountFields({ name, email, password: input.password });
  if (await deps.findByEmail(email)) throw new Error("Email này đã có tài khoản");
  const id = deps.newId();
  await deps.insertIdentity({
    id,
    email,
    name,
    passwordHash: deps.hashPassword(input.password),
  });
  return { id, email, name };
}

export async function authenticateRealIdentity(
  deps: {
    findByEmail: (email: string) => Promise<
      { id: string; email: string; name: string; passwordHash: string } | null
    >;
    passwordMatches: (password: string, stored: string) => boolean;
  },
  input: { email: string; password: string; pilotEmails: readonly string[] },
): Promise<{ id: string; email: string; name: string }> {
  const email = normalizeAccountEmail(input.email);
  if (isFictionalPilotEmail(email, input.pilotEmails)) {
    throw new Error("Đăng nhập thử đang tắt");
  }
  const user = await deps.findByEmail(email);
  if (!user || !deps.passwordMatches(input.password, user.passwordHash)) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }
  return { id: user.id, email: user.email, name: user.name };
}

/** A leftover fictional session must not survive DEV_SIGN_IN being off. */
export function visibleSessionUser<T extends { email: string }>(
  user: T | null,
  devSignInOn: boolean,
  pilotEmails: readonly string[],
): T | null {
  if (!user) return null;
  if (!devSignInOn && isFictionalPilotEmail(user.email, pilotEmails)) return null;
  return user;
}
