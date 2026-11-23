import React from "react";
import { TextInline } from "@/types/markdown";

export const TextNode: React.FC<{ node: TextInline }> = ({ node }) => {
  return <>{node.value}</>;
};
