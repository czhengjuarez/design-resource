import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { buttonClass, inputClass } from "../keel";
import { useLogin, useSession } from "./useAdminAuth";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const login = useLogin();
  const { data: session, isLoading } = useSession();

  if (!isLoading && session?.authenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) login.mutate(password);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--of-bg-base)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ background: "var(--of-bg-elevated)", borderColor: "var(--of-border-line)", boxShadow: "var(--of-shadow-md)" }}
      >
        <div
          className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "var(--of-bg-brand-tint)", color: "var(--of-fg-brand)" }}
        >
          <Lock size={18} strokeWidth={1.75} />
        </div>
        <h1
          className="text-center text-base font-semibold"
          style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}
        >
          Admin sign in
        </h1>
        <p className="mt-1 text-center text-xs" style={{ color: "var(--of-fg-subtle)" }}>
          Design Resources administration
        </p>

        <div className="of-field mt-5">
          <label className="of-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            className={inputClass()}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            autoComplete="current-password"
          />
        </div>

        {login.isError && (
          <p className="mt-2 text-xs" style={{ color: "var(--of-fg-danger)" }}>
            {login.error instanceof Error ? login.error.message : "Login failed"}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending || !password.trim()}
          className={buttonClass({ variant: "primary", size: "md", className: "mt-4 w-full justify-center", disabled: login.isPending || !password.trim() })}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>

        <a href="/" className="mt-4 block text-center text-xs" style={{ color: "var(--of-fg-subtle)" }}>
          ← Back to public site
        </a>
      </form>
    </div>
  );
}
