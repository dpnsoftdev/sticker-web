import type { JSONContent, AnyExtension } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import type { DangoEditorInitialContent } from "../types";

/**
 * Converts `content` prop into Tiptap JSON. Strips/accepts:
 * - JSON / previously saved getJSON() output
 * - HTML
 * - empty
 */
export function resolveInitialContent(
  content: DangoEditorInitialContent,
  extensions: AnyExtension[]
): JSONContent {
  if (content == null || content === "") {
    return generateJSON("<p></p>", extensions);
  }
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as JSONContent;
        if (parsed && typeof parsed === "object" && parsed.type === "doc") {
          return parsed;
        }
      } catch {
        /* not JSON — treat as HTML */
      }
    }
    return generateJSON(content, extensions);
  }
  return content;
}
