import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchSession(): Promise<{ authenticated: boolean }> {
  const r = await fetch("/api/auth/session");
  if (!r.ok) return { authenticated: false };
  return r.json();
}

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSession,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? "Login failed");
      }
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "session"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "session"] }),
  });
}
