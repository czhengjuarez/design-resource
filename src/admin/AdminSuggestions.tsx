import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { adminApi } from "./api";
import { buttonClass, badgeClass } from "../keel";
import Modal from "./Modal";
import ResourceForm from "./ResourceForm";
import type { Resource } from "../types";

export default function AdminSuggestions() {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<Resource | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "suggestions"],
    queryFn: adminApi.listSuggestions,
  });

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.listCategories,
  });
  const cats = catData?.categories ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "suggestions"] });
    qc.invalidateQueries({ queryKey: ["resources"] });
  };

  const approveMut = useMutation({
    mutationFn: ({ id, edits }: { id: number; edits?: Partial<Resource> }) =>
      adminApi.approveSuggestion(id, edits),
    onSuccess: () => { setReviewing(null); invalidate(); },
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) => adminApi.rejectSuggestion(id),
    onSuccess: () => invalidate(),
  });

  const catName = (id: number | null) => cats.find((c) => c.id === id)?.name ?? "—";

  const items = data?.items ?? [];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}>
          Suggestions
          {items.length > 0 && (
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: "var(--of-bg-brand)", color: "var(--of-fg-on-brand)" }}
            >
              {items.length} pending
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--of-fg-muted)" }}>
          Review publicly submitted resources before they appear on the site.
        </p>
      </div>

      {isLoading && <p className="text-sm" style={{ color: "var(--of-fg-subtle)" }}>Loading…</p>}

      {!isLoading && items.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
          style={{ borderColor: "var(--of-border-line)", background: "var(--of-bg-elevated)" }}
        >
          <Check size={32} strokeWidth={1.5} style={{ color: "var(--of-fg-success)" }} />
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--of-fg-default)" }}>All caught up</p>
          <p className="mt-1 text-xs" style={{ color: "var(--of-fg-subtle)" }}>No pending suggestions.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border p-4"
            style={{ background: "var(--of-bg-elevated)", borderColor: "var(--of-border-line)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={badgeClass({ variant: "default" })}>{r.type}</span>
                  <span className="text-xs" style={{ color: "var(--of-fg-subtle)" }}>{catName(r.categoryId)}</span>
                </div>
                <p className="mt-1.5 font-medium" style={{ color: "var(--of-fg-default)", fontSize: "var(--of-text-sm)" }}>{r.title}</p>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs" style={{ color: "var(--of-fg-brand)" }}>
                    {r.url}
                  </a>
                )}
                {r.description && (
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--of-fg-muted)" }}>{r.description}</p>
                )}
                {(r.submitterName || r.submitterEmail) && (
                  <p className="mt-2 text-xs" style={{ color: "var(--of-fg-subtle)" }}>
                    Submitted by {r.submitterName ?? ""} {r.submitterEmail ? `<${r.submitterEmail}>` : ""}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setReviewing(r)}
                  className={buttonClass({ variant: "secondary", size: "sm" })}
                >
                  Review &amp; edit
                </button>
                <button
                  onClick={() => approveMut.mutate({ id: r.id })}
                  disabled={approveMut.isPending}
                  className={buttonClass({ variant: "primary", size: "sm" })}
                  title="Approve"
                >
                  <Check size={13} strokeWidth={1.75} /> Approve
                </button>
                <button
                  onClick={() => rejectMut.mutate(r.id)}
                  disabled={rejectMut.isPending}
                  className={buttonClass({ variant: "danger", size: "sm" })}
                  title="Reject"
                >
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review + edit before approving */}
      {reviewing && (
        <Modal title="Review suggestion" onClose={() => setReviewing(null)}>
          <ResourceForm
            initial={reviewing}
            categories={cats}
            onSave={(edits) => approveMut.mutate({ id: reviewing.id, edits })}
            onCancel={() => setReviewing(null)}
            saving={approveMut.isPending}
          />
        </Modal>
      )}
    </div>
  );
}
