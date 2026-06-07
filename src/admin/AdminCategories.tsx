import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { adminApi } from "./api";
import { buttonClass, inputClass, selectClass } from "../keel";
import Modal from "./Modal";

interface FlatCat {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
  resourceCount?: number;
  children: FlatCat[];
}

function buildTree(cats: FlatCat[]): FlatCat[] {
  const map = new Map<number, FlatCat>();
  for (const c of cats) map.set(c.id, { ...c, children: [] });
  const roots: FlatCat[] = [];
  for (const c of map.values()) {
    if (c.parentId != null && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(c);
    } else {
      roots.push(c);
    }
  }
  const sort = (list: FlatCat[]) => { list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)); list.forEach((c) => sort(c.children)); };
  sort(roots);
  return roots;
}

function CategoryRow({
  cat,
  depth,
  allCats,
  onEdit,
  onAddChild,
  onDelete,
}: {
  cat: FlatCat;
  depth: number;
  allCats: FlatCat[];
  onEdit: (c: FlatCat) => void;
  onAddChild: (parentId: number) => void;
  onDelete: (c: FlatCat) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = cat.children.length > 0;

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--of-border-subtle)" }}>
        <td className="px-3 py-2">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center"
              style={{ color: "var(--of-fg-subtle)", visibility: hasChildren ? "visible" : "hidden" }}
            >
              {open ? <ChevronDown size={12} strokeWidth={1.75} /> : <ChevronRight size={12} strokeWidth={1.75} />}
            </button>
            {cat.icon && <span className="mr-1.5 text-sm">{cat.icon}</span>}
            <span className="text-sm font-medium" style={{ color: "var(--of-fg-default)" }}>{cat.name}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-xs" style={{ color: "var(--of-fg-subtle)" }}>{cat.slug}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <button onClick={() => onAddChild(cat.id)} className={buttonClass({ variant: "ghost", size: "sm" })} style={{ padding: "0 6px" }} title="Add child">
              <Plus size={13} strokeWidth={1.75} />
            </button>
            <button onClick={() => onEdit(cat)} className={buttonClass({ variant: "ghost", size: "sm" })} style={{ padding: "0 6px" }} title="Edit">
              <Pencil size={13} strokeWidth={1.75} />
            </button>
            <button onClick={() => onDelete(cat)} className={buttonClass({ variant: "ghost", size: "sm" })} style={{ padding: "0 6px", color: "var(--of-fg-danger)" }} title="Delete">
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && open && cat.children.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} allCats={allCats} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} />
      ))}
    </>
  );
}

function CatForm({
  initial,
  allCats,
  forcedParentId,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<FlatCat>;
  allCats: FlatCat[];
  forcedParentId?: number | null;
  onSave: (data: { name: string; icon: string; description: string; parentId: number | null }) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [parentId, setParentId] = useState<number | null>(
    forcedParentId !== undefined ? forcedParentId : (initial?.parentId ?? null)
  );

  const flatCats: { id: number; label: string }[] = [];
  const roots = allCats.filter((c) => c.parentId == null && c.id !== initial?.id);
  const children = (pid: number) => allCats.filter((c) => c.parentId === pid && c.id !== initial?.id);
  const walk = (cats: FlatCat[], depth: number) => {
    for (const c of cats) {
      flatCats.push({ id: c.id, label: " ".repeat(depth * 3) + c.name });
      walk(children(c.id), depth + 1);
    }
  };
  walk(roots, 0);

  return (
    <div className="space-y-3">
      <div className="of-field">
        <label className="of-label">Name *</label>
        <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="of-field">
          <label className="of-label">Icon (emoji)</label>
          <input className={inputClass()} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚" maxLength={4} />
        </div>
        <div className="of-field">
          <label className="of-label">Parent</label>
          <select
            className={selectClass()}
            value={parentId ?? ""}
            disabled={forcedParentId !== undefined}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— top level —</option>
            {flatCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="of-field">
        <label className="of-label">Description</label>
        <input className={inputClass()} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className={buttonClass({ variant: "secondary", size: "sm" })}>Cancel</button>
        <button onClick={() => onSave({ name, icon, description, parentId })} disabled={saving || !name.trim()} className={buttonClass({ variant: "primary", size: "sm", disabled: saving || !name.trim() })}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FlatCat | null>(null);
  const [addingChildOf, setAddingChildOf] = useState<number | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<FlatCat | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.listCategories,
  });

  const allFlat = (data?.categories ?? []) as FlatCat[];
  const tree = buildTree(allFlat);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMut = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => { setAddingChildOf(undefined); invalidate(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof adminApi.updateCategory>[1] }) =>
      adminApi.updateCategory(id, body),
    onSuccess: () => { setEditing(null); invalidate(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: () => { setDeleting(null); invalidate(); },
  });

  const parentName = (id: number | null) => allFlat.find((c) => c.id === id)?.name;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}>
          Categories
          {data && <span className="ml-2 text-sm font-normal" style={{ color: "var(--of-fg-subtle)" }}>({allFlat.length})</span>}
        </h1>
        <button onClick={() => setAddingChildOf(null)} className={buttonClass({ variant: "primary", size: "sm" })}>
          <Plus size={14} strokeWidth={1.75} /> Add top-level
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--of-border-line)" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--of-bg-recessed)" }}>
            <tr>
              {["Name", "Slug", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--of-fg-subtle)", borderBottom: "1px solid var(--of-border-line)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-sm" style={{ color: "var(--of-fg-subtle)" }}>Loading…</td></tr>
            )}
            {tree.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                depth={0}
                allCats={allFlat}
                onEdit={setEditing}
                onAddChild={(pid) => setAddingChildOf(pid)}
                onDelete={setDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {addingChildOf !== undefined && (
        <Modal title={addingChildOf == null ? "Add top-level category" : "Add child category"} onClose={() => setAddingChildOf(undefined)}>
          <CatForm
            allCats={allFlat}
            forcedParentId={addingChildOf}
            onSave={({ name, icon, description, parentId }) =>
              createMut.mutate({ name, icon: icon || undefined, description: description || undefined, parentId })
            }
            onCancel={() => setAddingChildOf(undefined)}
            saving={createMut.isPending}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit category" onClose={() => setEditing(null)}>
          <CatForm
            initial={editing}
            allCats={allFlat}
            onSave={({ name, icon, description, parentId }) =>
              updateMut.mutate({ id: editing.id, body: { name, icon: icon || null, description: description || null, parentId } })
            }
            onCancel={() => setEditing(null)}
            saving={updateMut.isPending}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <Modal
          title="Delete category"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button onClick={() => setDeleting(null)} className={buttonClass({ variant: "secondary", size: "sm" })}>Cancel</button>
              <button onClick={() => deleteMut.mutate(deleting.id)} disabled={deleteMut.isPending} className={buttonClass({ variant: "danger", size: "sm" })}>
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-sm" style={{ color: "var(--of-fg-muted)" }}>
            Delete <strong style={{ color: "var(--of-fg-default)" }}>{deleting.name}</strong>?
          </p>
          {(deleting.children?.length > 0 || true) && (
            <p className="mt-2 text-sm" style={{ color: "var(--of-fg-muted)" }}>
              Its subcategories and resources will be reparented to{" "}
              <strong style={{ color: "var(--of-fg-default)" }}>
                {deleting.parentId ? parentName(deleting.parentId) : "the top level"}
              </strong>.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
