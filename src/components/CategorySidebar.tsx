import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { CategoryNode } from '../types';

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
        className="flex items-center rounded-md pr-1"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-7 w-6 shrink-0 items-center justify-center"
          style={{ color: 'var(--of-fg-subtle)', visibility: hasChildren ? 'visible' : 'hidden' }}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open
            ? <ChevronDown size={14} strokeWidth={1.75} />
            : <ChevronRight size={14} strokeWidth={1.75} />}
        </button>
        <button
          onClick={() => onSelect(node.id)}
          className="flex flex-1 items-center gap-2 truncate rounded-md py-1 pl-1 pr-2 text-left text-sm transition-colors"
          style={{
            background: isSelected ? 'var(--of-bg-brand-tint)' : 'transparent',
            color: isSelected ? 'var(--of-fg-brand)' : 'var(--of-fg-muted)',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--of-bg-recessed)';
          }}
          onMouseLeave={(e) => {
            if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {node.icon && <span className="shrink-0 text-base leading-none">{node.icon}</span>}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto shrink-0 text-xs" style={{ color: 'var(--of-fg-subtle)' }}>
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
    <nav>
      <button
        onClick={() => onSelect(null)}
        className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
        style={{
          background: selectedId === null ? 'var(--of-bg-brand-tint)' : 'transparent',
          color: selectedId === null ? 'var(--of-fg-brand)' : 'var(--of-fg-default)',
        }}
        onMouseEnter={(e) => {
          if (selectedId !== null) (e.currentTarget as HTMLElement).style.background = 'var(--of-bg-recessed)';
        }}
        onMouseLeave={(e) => {
          if (selectedId !== null) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <span>All resources</span>
        <span style={{ color: 'var(--of-fg-subtle)', fontSize: '12px' }}>{grandTotal}</span>
      </button>
      <ul className="space-y-0.5">
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
