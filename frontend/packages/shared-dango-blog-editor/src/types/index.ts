import type { AnyExtension, JSONContent } from "@tiptap/core";

/** Returns a public URL (or data URL) for the uploaded image. App supplies storage/API; editor only calls this. */
export type UploadAdapter = (file: File) => Promise<string>;

export type DangoEditorChange = {
  json: JSONContent;
  html: string;
  text: string;
};

/** `content` is JSON from a previous save, an HTML string to hydrate, or undefined for empty. */
export type DangoEditorInitialContent = JSONContent | string | null | undefined;

export type DangoBlogEditorProps = {
  /** JSON from `getJSON()` or HTML, or `undefined` for an empty document. */
  content?: DangoEditorInitialContent;
  onChange?: (value: DangoEditorChange) => void;
  /** Required for the Image toolbar: returns a public URL. No fetch inside the editor. */
  uploadAdapter?: UploadAdapter;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  /** Merged with built-in Tiptap extensions. */
  extraExtensions?: AnyExtension[];
  "aria-label"?: string;
};

export type { JSONContent } from "@tiptap/core";
