import { useState } from "react";
import { buttonClass, inputClass, selectClass } from "../keel";
import type { Resource } from "../types";

const TYPES = ["article","book","talk","video","tool","person","event","thread","note","method","podcast","newsletter"];

export default function ResourceForm({
  initial,
  categories,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Resource>;
  categories: { id: number; name: string; parentId: number | null }[];
  onSave: (data: Partial<Resource>) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<Partial<Resource>>({
    title: "",
    description: "",
    url: "",
    type: "article",
    author: "",
    tags: [],
    status: "published",
    categoryId: null,
    ...initial,
  });
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(", "));

  const set = (k: keyof Resource, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ ...form, tags });
  };

  // Build a flat indented list for the category select
  const flatCats: { id: number; label: string }[] = [];
  const roots = categories.filter((c) => c.parentId == null);
  const children = (parentId: number) => categories.filter((c) => c.parentId === parentId);
  const walk = (cats: typeof categories, depth: number) => {
    for (const c of cats) {
      flatCats.push({ id: c.id, label: " ".repeat(depth * 3) + c.name });
      walk(children(c.id), depth + 1);
    }
  };
  walk(roots, 0);

  const field = (label: string, node: React.ReactNode) => (
    <div className="of-field">
      <label className="of-label">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="space-y-3">
      {field("Title *", (
        <input className={inputClass()} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Resource title" />
      ))}
      {field("URL", (
        <input className={inputClass()} value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
      ))}
      <div className="grid grid-cols-2 gap-3">
        {field("Type", (
          <select className={selectClass()} value={form.type ?? "article"} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ))}
        {field("Status", (
          <select className={selectClass()} value={form.status ?? "published"} onChange={(e) => set("status", e.target.value)}>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        ))}
      </div>
      {field("Category", (
        <select className={selectClass()} value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}>
          <option value="">— none —</option>
          {flatCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      ))}
      {field("Author", (
        <input className={inputClass()} value={form.author ?? ""} onChange={(e) => set("author", e.target.value)} placeholder="Author name" />
      ))}
      {field("Description", (
        <textarea
          className="of-textarea"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Short description…"
        />
      ))}
      {field("Tags (comma-separated)", (
        <input className={inputClass()} value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="design systems, leadership…" />
      ))}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className={buttonClass({ variant: "secondary", size: "sm" })}>Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.title?.trim()} className={buttonClass({ variant: "primary", size: "sm", disabled: saving || !form.title?.trim() })}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
