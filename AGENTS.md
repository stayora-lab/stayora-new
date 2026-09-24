Repository role: CP8-G PROTOTYPE / VALIDATION ARTIFACT
Write owner: Grok

Claude Code and Codex are READ-ONLY unless the Founder explicitly changes
repository ownership.

This repository is NOT product source of truth.

Canonical product semantics come from stayora-spec at the spec commit named in the
task.

Prototype concreteness does not create product policy.

A passing test does not legitimize a known deviation from the Protected Baseline.

NOT REPRESENTED does not mean PASS.

Do not resolve TBDs through implementation. Concrete values needed for simulation
must be labeled PROTOTYPE ASSUMPTION.

Every prototype change must identify the journey / gate / coverage row / known
deviation it addresses.

No cross-repository write in the same task.

Test data only: no real owner names, real unit codes, real guest data or real prices.

Every task states:
Spec baseline: <SHA>
Prototype baseline: <SHA>

---

## Technical setup (this repository)

You run tools, edit files, start servers and drive Playwright in a Linux sandbox
at `/workspace`. The user is in the Grok chat UI and can only chat and watch a
live preview. The preview proxy auto-discovers a server on `0.0.0.0:8080`.
Success = the app running on `0.0.0.0:8080`, verified by you, dev server left up.

### Environment

- Project root: `/workspace`. Node 22.
- Bind the app on `0.0.0.0:8080`. Do not bind loopback-only. Do not pick another port.
- `/workspace/startup.sh` is the restart contract. Path is fixed. Keep it in sync
  with the start command. Idempotent: probe `http://127.0.0.1:8080/`, start only
  if down, background so the script returns fast.
- Start the app with `npm run dev` — never `vite` / `npx vite` directly. Only the
  npm scripts run Vite through `scripts/with-app-env.mjs`.
- Do not create a `.env` file. The platform injects `DATABASE_URL` and auth creds
  on deploy. Only `VITE_`-prefixed vars reach the browser.
- Do not delete or overwrite `public/__grok/`, `server/`, `scripts/grok-pwa-*`,
  or the pre-wired `src/lib` helpers. App routes go in `src/routes/`, never `server/`.
- Keep `<PreviewHostBridge />` in `__root.tsx`. Keep `grokPwaPlugin()` / branding
  injector. Never put `og:*` / `twitter:card` in `__root.tsx`.

### Commands

```text
npm run dev              # Vite on 0.0.0.0:8080 via with-app-env.mjs
npm run build            # production build + db:migrate
npm run typecheck
npm test
npm run preview:restart  # built output on 127.0.0.1:8081 for QA
npm run preview:stop
sh /workspace/startup.sh # revive / start if :8080 is down
node scripts/browser-smoke.mjs
```

Leave the dev server running. Restart it only for `vite.config` / dependency changes.
Verify a real browser render on dev (`:8080`) and on the built output (`preview:restart`).
A 200 from curl is not enough.

### DEV_SIGN_IN

Server-only flag. Never a `VITE_` variable. Unset means off.

- On only when `DEV_SIGN_IN` is `1` or `true` (case-insensitive).
- Any other value, empty, or unset → off. Sign-in must refuse before account lookup
  (`DEV_SIGN_IN_OFF`). `/dev/accounts` is `notFound()` when the flag is off.
- Shared prototype password lives only in server modules. Do not put it in client
  modules (`pilot-data.ts`, `login.tsx`, `dev.accounts.tsx`).
