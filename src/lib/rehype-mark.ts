import { highlightMatcher } from "@/lib/search";
import type { Element, ElementContent, Root, RootContent } from "hast";

/**
 * Wraps every match of `terms` in a <mark>, inside the rendered Markdown tree.
 * Highlighting the Markdown source instead would either break the syntax or,
 * as the search view used to do, show `**bold**` with its asterisks.
 */
export function rehypeMark(options: { terms: string[]; className?: string }) {
  const matcher = highlightMatcher(options.terms);
  const terms = new Set(options.terms);

  const mark = (value: string): Element => ({
    type: "element",
    tagName: "mark",
    properties: options.className ? { className: [options.className] } : {},
    children: [{ type: "text", value }],
  });

  const visit = (node: Root | Element) => {
    if (!matcher) return;
    const next: (ElementContent | RootContent)[] = [];

    for (const child of node.children) {
      if (child.type === "text") {
        for (const part of child.value.split(matcher)) {
          if (!part) continue;
          next.push(
            terms.has(part.toLowerCase())
              ? mark(part)
              : { type: "text", value: part },
          );
        }
      } else {
        if (child.type === "element" && child.tagName !== "mark") visit(child);
        next.push(child);
      }
    }

    node.children = next as typeof node.children;
  };

  return (tree: Root) => visit(tree);
}
