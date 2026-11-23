import React from "react";
import { TableBlock as TableBlockType } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";

export const TableBlock: React.FC<{ node: TableBlockType; docPath?: string }> = ({
  node,
  docPath,
}) => {
  const getAlignClass = (align: string) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className="my-4 w-full overflow-x-auto rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] shadow-sm">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--fluent-border-card)] bg-[var(--fluent-bg-subtle-hover)]">
            {node.columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-2.5 font-semibold text-[var(--fluent-text-primary)] ${getAlignClass(
                  col.align
                )}`}
              >
                {col.header.map((child, cIdx) => (
                  <MarkdownInline key={cIdx} node={child} docPath={docPath} />
                ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {node.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="border-b border-[var(--fluent-border-subtle)] hover:bg-[var(--fluent-bg-subtle-hover)]/40 transition-colors last:border-b-0"
            >
              {row.cells.map((cell, cIdx) => {
                const align = node.columns[cIdx]?.align ?? "none";
                return (
                  <td
                    key={cIdx}
                    className={`px-4 py-2.5 text-[var(--fluent-text-primary)] ${getAlignClass(
                      align
                    )}`}
                  >
                    {cell.map((child, iIdx) => (
                      <MarkdownInline key={iIdx} node={child} docPath={docPath} />
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
