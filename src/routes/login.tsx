import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { fetchDevSignInGate, signInDevAccount, signUpDevAccount } from "@/lib/dev-identity-api";
import { PILOT_SEED } from "@/lib/pilot-data";
import { workspaceFor } from "@/lib/role";
import { useBookingStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  loader: () => fetchDevSignInGate(),
  component: LoginPage,
});

function LoginPage() {
  const gate = Route.useLoaderData();
  const navigate = useNavigate();
  const refreshIdentity = useBookingStore((state) => state.refreshIdentity);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const session =
        mode === "up"
          ? await signUpDevAccount({ data: { name, email, password } })
          : await signInDevAccount({ data: { email, password } });
      await refreshIdentity();
      const grant = session.grants.find((item) => item.status === "active");
      if (!grant) {
        void navigate({ to: "/" });
        return;
      }
      void navigate({ to: workspaceFor(grant.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được");
    } finally {
      setPending(false);
    }
  }

  return (
    <main lang="vi" className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Chỉ dùng cho bản thử</p>
      <h1 className="mt-2 font-serif text-title">{mode === "up" ? "Tạo tài khoản thử" : "Đăng nhập"}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Đăng ký chỉ tạo danh tính. Không tự có vai trò. Khách đặt villa không cần tài khoản.
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-3">
        {mode === "up" ? (
          <label className="block text-sm">
            Tên
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </label>
        {error ? <p className="text-sm text-lotus-deep">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {mode === "up" ? "Tạo tài khoản" : "Đăng nhập"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm font-medium text-lotus"
        onClick={() => setMode(mode === "up" ? "in" : "up")}
      >
        {mode === "up" ? "Đã có tài khoản thử" : "Chưa có tài khoản — đăng ký"}
      </button>
      {gate.enabled ? (
        <section className="mt-10">
          <h2 className="font-medium">Đăng nhập tài khoản thử</h2>
          <p className="mt-2 text-xs text-muted">Mật khẩu chung: {gate.password}</p>
          <ul className="mt-3 space-y-2">
            {(PILOT_SEED.people ?? []).map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  className="w-full rounded-xl bg-paper px-3 py-2 text-left text-sm shadow-[var(--shadow-border)]"
                  onClick={() => {
                    setMode("in");
                    setEmail(person.email);
                    setPassword(gate.password);
                  }}
                >
                  {person.name}
                  <span className="mt-0.5 block text-xs text-muted">{person.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
