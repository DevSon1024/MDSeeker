import React from "react";
import { HardBreakInline, SoftBreakInline } from "@/types/markdown";

export const BreakNode: React.FC<{ node: SoftBreakInline | HardBreakInline }> = ({
  node,
}) => {
  if (node.type === "hardBreak") {
    return <br className="my-1" />;
  }
  // Soft break renders as natural space in HTML
  return <> </>;
};
