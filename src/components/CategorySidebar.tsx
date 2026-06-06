import { useState } from "react";
import type { CategoryNode } from "../types";

/** Total published resources in a node and all its descendants. */
function rollup(node: CategoryNode): number {
  return node.children.reduce((sum, c) => sum + rollup(c), node.resourceCount);
}

function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: CategoryNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const total = rollup(node);
  const isSelected = selectedId === node.id;

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-md pr-2 text-sm ${
          isSelected
            ? "bg-emerald-500/15 text-emerald-300"
            : "text-neutral-300 hover:bg-neutral-800/60"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-6 w-5 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-200"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <button
          onClick={() => onSelect(node.id)}
          className="flex flex-1 items-center gap-2 truncate py-1.5 text-left"
        >
          {node.icon && <span className="shrink-0">{node.icon}</span>}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto shrink-0 text-xs text-neutral-500">
            {total}
          </span>
        </button>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategorySidebar({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryNode[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const grandTotal = categories.reduce((s, c) => s + rollup(c), 0);

  return (
    <nav className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${
          selectedId === null
            ? "bg-emerald-500/15 text-emerald-300"
            : "text-neutral-300 hover:bg-neutral-800/60"
        }`}
      >
        <span className="font-medium">All resources</span>
        <span className="text-xs text-neutral-500">{grandTotal}</span>
      </button>
      <ul>
        {categories.map((cat) => (
          <TreeItem
            key={cat.id}
            node={cat}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  );
}
