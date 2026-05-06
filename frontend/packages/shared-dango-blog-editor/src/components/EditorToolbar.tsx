import type { Editor } from "@tiptap/core";
import { useCallback, useRef, useState } from "react";

const btnClass = "dango-tb__btn";
const groupClass = "dango-tb__group";

type Props = {
  editor: Editor;
  onInsertImage: (file: File) => void;
  canInsertImage: boolean;
};

export function EditorToolbar({ editor, onInsertImage, canInsertImage }: Props) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyLink = useCallback(() => {
    const u = linkUrl.trim();
    if (u) {
      editor.chain().focus().setLink({ href: u, rel: "noopener noreferrer" }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const startLink = useCallback(() => {
    const cur = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(typeof cur === "string" ? cur : "");
    setLinkOpen((v) => !v);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="dango-toolbar" data-testid="dango-blog-toolbar" role="toolbar" aria-label="Format">
      <div className={groupClass}>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-active={editor.isActive("heading", { level: 1 }) || undefined}
        >
          H1
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive("heading", { level: 2 }) || undefined}
        >
          H2
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-active={editor.isActive("heading", { level: 3 }) || undefined}
        >
          H3
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().setParagraph().run()}
          data-active={editor.isActive("paragraph") || undefined}
        >
          P
        </button>
      </div>
      <div className={groupClass}>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold") || undefined}
        >
          B
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive("italic") || undefined}
        >
          I
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          data-active={editor.isActive("underline") || undefined}
        >
          U
        </button>
      </div>
      <div className={groupClass}>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive("bulletList") || undefined}
        >
          • List
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive("orderedList") || undefined}
        >
          1. List
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive("blockquote") || undefined}
        >
          &ldquo; &rdquo;
        </button>
      </div>
      <div className={groupClass}>
        <button type="button" className={btnClass} onClick={startLink} data-active={editor.isActive("link") || undefined}>
          Link
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="dango-sr"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onInsertImage(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={btnClass}
          disabled={!canInsertImage}
          title={canInsertImage ? "Insert image" : "Set uploadAdapter to enable images"}
          onClick={() => canInsertImage && fileInputRef.current?.click()}
        >
          Image
        </button>
      </div>
      {linkOpen ? (
        <div className="dango-toolbar__linkRow">
          <input
            className="dango-toolbar__linkInput"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://…"
            aria-label="Link URL"
          />
          <button type="button" className={btnClass} onClick={applyLink}>
            Apply
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={() => {
              setLinkOpen(false);
              setLinkUrl("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
