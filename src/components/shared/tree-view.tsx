import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: string;
  label: string;
  icon?: LucideIcon;
  meta?: ReactNode;
  children?: TreeNode[];
};

/** File-explorer style hierarchy navigator (campus > blocos > ambientes, categorias, etc). */
export function TreeView({
  nodes,
  selectedId,
  onSelect,
  defaultExpanded = [],
  level = 0,
}: {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect: (node: TreeNode) => void;
  defaultExpanded?: string[];
  level?: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultExpanded.map((id) => [id, true])),
  );

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        const hasChildren = !!node.children?.length;
        const isOpen = expanded[node.id] ?? level === 0;
        const Icon = node.icon;
        return (
          <li key={node.id}>
            <div
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-2 text-sm transition-colors",
                selectedId === node.id ? "bg-accent text-foreground" : "hover:bg-accent/60",
              )}
              style={{ paddingLeft: level * 14 }}
            >
              <button
                type="button"
                className={cn("flex h-6 w-5 items-center justify-center text-muted-foreground", !hasChildren && "invisible")}
                onClick={() => setExpanded((e) => ({ ...e, [node.id]: !isOpen }))}
              >
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onSelect(node)}
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
              >
                {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                <span className="truncate">{node.label}</span>
                {node.meta ? <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{node.meta}</span> : null}
              </button>
            </div>
            {hasChildren && isOpen ? (
              <TreeView nodes={node.children!} selectedId={selectedId} onSelect={onSelect} level={level + 1} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}