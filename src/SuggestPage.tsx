import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { fetchCategories } from "./api";
import { buttonClass, inputClass, selectClass } from "./keel";
import type { CategoryNode } from "./types";

const TYPES = [
  { value: "article", label: "Article" },
  { value: "book", label: "Book" },
  { value: "talk", label: "Talk" },
  { value: "video", label: "Video" },
  { value: "tool", label: "Tool" },
  { value: "person", label: "Person" },
  { value: "event", label: "Event" },
  { value: "thread", label: "Thread" },
  { value: "note", label: "Note" },
  { value: "method", label: "Method" },
  { value: "podcast", label: "Podcast" },
  { value: "newsletter", label: "Newsletter" },
];

interface SuggestionPayload {
  title: string;
  url: string;
  type: string;
  categoryId: number | null;
  description: string;
  submitterName: string;
  submitterEmail: string;
  honeypot: string;
  renderedAt: number;
}

function flattenCategories(categories: CategoryNode[]): { id: number; label: string }[] {
  const out: { id: number; label: string }[] = [];
  const walk = (nodes: CategoryNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ id: n.id, label: "   ".repeat(depth) + n.name });
      walk(n.children, depth + 1);
    }
  };
  walk(categories, 0);
  return out;
}

async function submitSuggestion(payload: SuggestionPayload) {
  const r = await fetch("/api/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? "Submission failed");
  }
  return r.json();
}

export default function SuggestPage() {
  const renderedAt = useRef(Date.now());
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("article");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const flatCats = categoriesQuery.data ? flattenCategories(categoriesQuery.data) : [];

  const mutation = useMutation({
    mutationFn: () =>
      submitSuggestion({
        title: title.trim(),
        url: url.trim(),
        type,
        categoryId,
        description: description.trim(),
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        honeypot,
        renderedAt: renderedAt.current,
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) mutation.mutate();
  };

  if (mutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--of-bg-base)" }}>
        <div className="max-w-md text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--of-bg-success-tint)", color: "var(--of-fg-success)" }}
          >
            <CheckCircle2 size={22} strokeWidth={1.75} />
          </div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}>
            Thanks for the suggestion!
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--of-fg-muted)" }}>
            Your resource has been submitted for review. Once approved, it'll appear in the library.
          </p>
          <a href="/" className={buttonClass({ variant: "secondary", size: "sm", className: "mt-5 inline-flex" })}>
            <ArrowLeft size={14} strokeWidth={1.75} /> Back to the library
          </a>
        </div>
      </div>
    );
  }

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div className="of-field">
      <label className="of-label">{label}</label>
      {node}
      {hint && <p className="of-field__hint">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--of-bg-base)", color: "var(--of-fg-default)" }}>
      <div className="mx-auto max-w-xl px-4 py-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--of-fg-subtle)" }}>
          <ArrowLeft size={13} strokeWidth={1.75} /> Back to the library
        </a>

        <h1
          className="mt-4 text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--of-font-display)", color: "var(--of-fg-default)" }}
        >
          Suggest a resource
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--of-fg-muted)" }}>
          Found something the design community should know about? Share it here —
          a curator reviews every suggestion before it's published.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {field("Title *", (
            <input
              className={inputClass()}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's it called?"
              required
            />
          ))}

          {field("URL", (
            <input
              type="url"
              className={inputClass()}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          ))}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Type", (
              <select className={selectClass()} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            ))}
            {field("Category", (
              <select
                className={selectClass()}
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                disabled={categoriesQuery.isLoading}
              >
                <option value="">— optional —</option>
                {flatCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            ))}
          </div>

          {field("Why is it worth sharing?", (
            <textarea
              className="of-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A sentence or two about what makes this useful…"
            />
          ), "Optional, but it helps the curator review faster.")}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Your name", (
              <input
                className={inputClass()}
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Optional"
                autoComplete="name"
              />
            ))}
            {field("Your email", (
              <input
                type="email"
                className={inputClass()}
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                placeholder="Optional — only used to follow up"
                autoComplete="email"
              />
            ))}
          </div>

          {/* Honeypot — hidden from real users via off-screen positioning, not display:none
              (display:none fields are commonly skipped by basic bots, this isn't) */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="text-sm" style={{ color: "var(--of-fg-danger)" }}>
              {mutation.error instanceof Error ? mutation.error.message : "Something went wrong."}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || !title.trim()}
            className={buttonClass({ variant: "primary", size: "md", className: "w-full justify-center sm:w-auto", disabled: mutation.isPending || !title.trim() })}
          >
            {mutation.isPending ? "Submitting…" : "Submit suggestion"}
          </button>
        </form>
      </div>
    </div>
  );
}
