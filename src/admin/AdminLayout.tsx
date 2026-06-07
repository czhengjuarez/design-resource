import { Navigate, NavLink, Outlet } from "react-router-dom";
import { LayoutList, FolderTree, Inbox, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { buttonClass } from "../keel";
import { useSession, useLogout } from "./useAdminAuth";

function usePendingCount() {
  return useQuery({
    queryKey: ["admin", "suggestions", "count"],
    queryFn: async () => {
      const r = await fetch("/api/admin/suggestions");
      if (!r.ok) throw new Error("failed");
      const d = await r.json() as { items: unknown[] };
      return d.items.length;
    },
    refetchInterval: 30_000,
  });
}

const NAV = [
  { to: "/admin/resources",   label: "Resources",   Icon: LayoutList },
  { to: "/admin/categories",  label: "Categories",  Icon: FolderTree },
  { to: "/admin/suggestions", label: "Suggestions", Icon: Inbox },
];

export default function AdminLayout() {
  const { data: session, isLoading } = useSession();
  const { data: pendingCount } = usePendingCount();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--of-bg-base)" }}>
        <p className="text-sm" style={{ color: "var(--of-fg-subtle)" }}>Loading…</p>
      </div>
    );
  }

  if (!session?.authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--of-bg-base)", color: "var(--of-fg-default)" }}>
      {/* Sidebar */}
      <aside
        className="flex w-52 shrink-0 flex-col border-r"
        style={{ borderColor: "var(--of-border-line)", background: "var(--of-bg-elevated)" }}
      >
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--of-border-line)" }}>
          <a href="/" className="text-xs" style={{ color: "var(--of-fg-subtle)" }}>← Public site</a>
          <p className="mt-1 text-sm font-semibold" style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}>
            Admin
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "font-medium" : ""
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--of-bg-brand-tint)" : "transparent",
                color: isActive ? "var(--of-fg-brand)" : "var(--of-fg-muted)",
              })}
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
              {label === "Suggestions" && pendingCount ? (
                <span
                  className="ml-auto rounded-full px-1.5 py-0.5 text-xs font-semibold"
                  style={{ background: "var(--of-bg-brand)", color: "var(--of-fg-on-brand)" }}
                >
                  {pendingCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: "var(--of-border-line)" }}>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className={buttonClass({ variant: "secondary", size: "sm", className: "w-full justify-center gap-1.5" })}
          >
            <LogOut size={13} strokeWidth={1.75} />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
