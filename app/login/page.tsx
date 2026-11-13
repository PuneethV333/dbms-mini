"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/client/api";
import { useAuth } from "@/lib/auth-context";
import { FullPageLoader } from "@/components/FullPageLoader";
import { SosMark } from "@/components/icons";

export default function LoginPage() {
  const { user, initializing, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) router.replace("/");
  }, [initializing, user, router]);

  if (initializing || user) {
    return <FullPageLoader label="RESTORING SESSION…" />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.replace(next?.startsWith("/") ? next : "/");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-stretch bg-night text-chalk">
      {/* Ambient night glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgba(225,45,74,0.08),transparent_70%),radial-gradient(50%_40%_at_15%_85%,rgba(56,70,111,0.12),transparent_70%)]"
      />

      {/* Brand panel */}
      <section className="relative hidden w-[46%] max-w-xl flex-col justify-between border-r border-line/60 p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-4">
          <SosMark className="h-3.5 w-40 text-signal" />
          <span className="font-mono text-[11px] tracking-[0.24em] text-faint">
            ··· SILENT DISTRESS SIGNAL ···
          </span>
        </div>

        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-chalk">
            Help,
            <br />
            without a&nbsp;sound.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-mist">
            One discreet tap alerts your trusted contacts and streams them your live
            location. Nothing rings, nothing flashes — the screen barely changes.
          </p>

          <ul className="mt-10 space-y-5">
            {[
              ["TRIGGER", "Tap or hold the dial. No sound, no confirmation."],
              ["TRACK", "Contacts get a private link with your moving position."],
              ["RESOLVE", "You end the alert; the link stops updating instantly."],
            ].map(([label, copy]) => (
              <li key={label} className="flex gap-4">
                <span className="mt-0.5 w-16 shrink-0 font-mono text-[11px] font-semibold tracking-[0.18em] text-signal-soft">
                  {label}
                </span>
                <p className="text-sm leading-relaxed text-mist">{copy}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[11px] leading-relaxed text-faint">
          Demo build — not a working product, not connected to any emergency services.
        </p>
      </section>

      {/* Form panel */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <span className="font-display text-3xl font-bold tracking-tight text-chalk">
                bSafe
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-faint">
              SILENT SOS · EMERGENCY WEB APP
            </p>
          </div>

          <p className="mt-6 rounded-xl border border-line bg-panel/70 p-3 text-center font-mono text-[11px] leading-relaxed text-mist">
            Demo build — this is <span className="font-semibold text-chalk">not a working product</span>{" "}
            and is for personal/portfolio use only. It is not connected to any emergency services.
          </p>

          <div className="mt-4 space-y-4 rounded-2xl border border-line bg-panel p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
            <div>
              <h2 className="font-display text-lg font-semibold text-chalk">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-0.5 text-xs text-mist">
                {mode === "signin"
                  ? "Sign in to access your SOS contacts and alerts."
                  : "Set up your emergency contacts and stay prepared."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label htmlFor="login-name" className="field-label">
                    Name
                  </label>
                  <input
                    id="login-name"
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="field-input"
                  />
                </div>
              )}
              <div>
                <label htmlFor="login-email" className="field-label">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="field-label">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field-input"
                />
              </div>
              {error && (
                <p className="rounded-xl border border-signal/30 bg-signal/10 px-3 py-2 text-xs leading-relaxed text-signal-soft">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-signal py-2.5 text-sm font-semibold text-white transition hover:bg-signal-bright disabled:opacity-50"
              >
                {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-mist">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-medium text-signal-soft hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-medium text-signal-soft hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <p className="border-t border-line pt-3 text-center font-mono text-[10px] leading-relaxed text-faint">
              DEMO LOGIN · priya@example.com · Password123!
            </p>
          </div>

          <SosMark className="mx-auto mt-8 h-2.5 w-28 text-line lg:hidden" />
        </div>
      </section>
    </div>
  );
}
