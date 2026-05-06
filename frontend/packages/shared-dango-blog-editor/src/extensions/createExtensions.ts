import type { AnyExtension } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { DangoImage } from "./dangoImage";
import { Hashtag } from "./hashtag";

export type CreateExtensionsOptions = {
  /** Shown when the document is empty. */
  placeholder?: string;
  /** Optional extra Tiptap extensions (nodes, marks, or functional extensions). */
  extra?: AnyExtension[];
};

/**
 * Default schema + toolbar: heading, basic marks, lists, blockquote, link, image, hashtag, placeholder.
 * Pass `extra` to register more extensions before mounting the editor.
 */
export function createDangoEditorExtensions(
  options: CreateExtensionsOptions = {}
): AnyExtension[] {
  const { placeholder, extra = [] } = options;

  return [
    StarterKit.configure({
      blockquote: { HTMLAttributes: { class: "dango-e-blockquote" } },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
      heading: { levels: [1, 2, 3] },
      horizontalRule: false,
      strike: false,
      code: false,
      codeBlock: false,
      dropcursor: {},
      history: { depth: 100 }
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: "https",
      HTMLAttributes: { class: "dango-e-link" }
    }),
    DangoImage,
    Hashtag,
    Placeholder.configure({
      placeholder: placeholder ?? "Write something…"
    }),
    ...extra
  ];
}

export { DangoImage } from "./dangoImage";
export { Hashtag } from "./hashtag";
