"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createDangoEditorExtensions } from "../extensions/createExtensions";
import { resolveInitialContent } from "../lib/resolveInitialContent";
import type { DangoBlogEditorProps } from "../types";
import { EditorToolbar } from "./EditorToolbar";

/**
 * Tiptap-based blog editor. Pass `uploadAdapter` to enable image insert; the editor does not call APIs on its own.
 * Import CSS from the published `dist` path, e.g. `import "shared-dango-blog-editor/dango-blog-editor.css"`.
 */
export function DangoBlogEditor({
  content,
  onChange,
  uploadAdapter,
  placeholder = "Write something…",
  readOnly = false,
  className,
  extraExtensions,
  "aria-label": ariaLabel,
}: DangoBlogEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const extensions = useMemo(
    () =>
      createDangoEditorExtensions({
        placeholder,
        extra: extraExtensions ?? [],
      }),
    [placeholder, extraExtensions],
  );

  const initial = useMemo(
    () => resolveInitialContent(content, extensions),
    [content, extensions],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions,
      content: initial,
      editable: !readOnly,
      editorProps: {
        attributes: { class: "dango-pm tiptap" },
      },
      onUpdate: (props) => {
        onChangeRef.current?.({
          json: props.editor.getJSON(),
          html: props.editor.getHTML(),
          text: props.editor.getText(),
        });
      },
    },
    [initial, extensions],
  );

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [readOnly, editor]);

  const handleImage = useCallback(
    (file: File) => {
      if (!editor || !uploadAdapter) return;
      void (async () => {
        const src = await uploadAdapter(file);
        if (src) {
          editor.chain().focus().setImage({ src }).run();
        }
      })();
    },
    [editor, uploadAdapter],
  );

  if (!editor) {
    return (
      <div
        className={["dango-editor", "dango-editor--skeleton", className]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={["dango-editor", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      {readOnly ? null : (
        <EditorToolbar
          editor={editor}
          onInsertImage={handleImage}
          canInsertImage={Boolean(uploadAdapter)}
        />
      )}
      <EditorContent className="dango-editor__content" editor={editor} />
    </div>
  );
}
