import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "./api";
import { buttonClass, badgeClass, inputClass, selectClass } from "../keel";
import Modal from "./Modal";
import ResourceForm from "./ResourceForm";
import type { Resource } from "../types";
import type { KeelBadgeVariant } from "../keel";

const STATUS_VARIANT: Record<string, KeelBadgeVariant> = {
  published: "green",
  pending: "amber",
  rejected: "red",
};

export default function AdminResources() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const params: Record<string, string | number> = { page };
  if (search) params.q = search;
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "resources", params],
    queryFn: () => adminApi.listResources(params),
  });

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.listCategories,
  });
  const cats = catData?.categories ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "resources"] });

  const createMut = useMutation({
    mutationFn: (body: Partial<Resource>) => adminApi.createResource(body),
    onSuccess: () => { setCreating(false); invalidate(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Resource> }) => adminApi.updateResource(id, body),
    onSuccess: () => { setEditing(null); invalidate(); qc.invalidateQueries({ queryKey: ["resources"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteResource(id),
    onSuccess: () => { setDeletingId(null); invalidate(); qc.invalidateQueries({ queryKey: ["resources"] }); },
  });

  const catName = (id: number | null) => cats.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}>
          Resources
          {data && <span className="ml-2 text-sm font-normal" style={{ color: "var(--of-fg-subtle)" }}>({data.total})</span>}
        </h1>
        <button onClick={() => setCreating(true)} className={buttonClass({ variant: "primary", size: "sm" })}>
          <Plus size={14} strokeWidth={1.75} /> Add resource
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2">
        <input
          className={inputClass({ className: "w-56" })}
          style={{ height: "32px", padding: "0 10px" }}
          placeholder="Search…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className={selectClass({ className: "w-36" })}
          style={{ height: "32px", padding: "0 8px" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--of-border-line)" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--of-bg-recessed)" }}>
            <tr>
              {["Title", "Type", "Category", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--of-fg-subtle)", borderBottom: "1px solid var(--of-border-line)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm" style={{ color: "var(--of-fg-subtle)" }}>Loading…</td></tr>
            )}
            {data?.items.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--of-border-subtle)" }}>
                <td className="px-3 py-2.5 max-w-xs">
                  <p className="truncate font-medium" style={{ color: "var(--of-fg-default)" }}>{r.title}</p>
                  {r.url && <p className="truncate text-xs" style={{ color: "var(--of-fg-subtle)" }}>{r.url}</p>}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={badgeClass({ variant: "default" })}>{r.type}</span>
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--of-fg-muted)" }}>
                  {catName(r.categoryId)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={badgeClass({ variant: STATUS_VARIANT[r.status] ?? "default" })}>{r.status}</span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditing(r)}
                      className={buttonClass({ variant: "ghost", size: "sm" })}
                      style={{ padding: "0 6px" }}
                      title="Edit"
                    >
                      <Pencil size={13} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => setDeletingId(r.id)}
                      className={buttonClass({ variant: "ghost", size: "sm" })}
                      style={{ padding: "0 6px", color: "var(--of-fg-danger)" }}
                      title="Delete"
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm" style={{ color: "var(--of-fg-subtle)" }}>No resources found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 50 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={buttonClass({ variant: "secondary", size: "sm" })}>
            <ChevronLeft size={13} strokeWidth={1.75} /> Prev
          </button>
          <span className="text-sm" style={{ color: "var(--of-fg-subtle)" }}>Page {page}</span>
          <button disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)} className={buttonClass({ variant: "secondary", size: "sm" })}>
            Next <ChevronRight size={13} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <Modal title="Add resource" onClose={() => setCreating(false)}>
          <ResourceForm
            categories={cats}
            onSave={(body) => createMut.mutate(body)}
            onCancel={() => setCreating(false)}
            saving={createMut.isPending}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit resource" onClose={() => setEditing(null)}>
          <ResourceForm
            initial={editing}
            categories={cats}
            onSave={(body) => updateMut.mutate({ id: editing.id, body })}
            onCancel={() => setEditing(null)}
            saving={updateMut.isPending}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deletingId != null && (
        <Modal
          title="Delete resource"
          onClose={() => setDeletingId(null)}
          footer={
            <>
              <button onClick={() => setDeletingId(null)} className={buttonClass({ variant: "secondary", size: "sm" })}>Cancel</button>
              <button
                onClick={() => deleteMut.mutate(deletingId)}
                disabled={deleteMut.isPending}
                className={buttonClass({ variant: "danger", size: "sm" })}
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-sm" style={{ color: "var(--of-fg-muted)" }}>
            This resource will be permanently deleted. This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
