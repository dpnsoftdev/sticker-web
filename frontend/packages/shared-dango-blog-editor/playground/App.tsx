import { useCallback, useMemo, useState } from "react";
import { DangoBlogEditor } from "shared-dango-blog-editor";
import type { DangoEditorChange, UploadAdapter } from "shared-dango-blog-editor";

const demoDataUrl: UploadAdapter = async (file) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only images");
  }
  return URL.createObjectURL(file);
};

type Tab = "json" | "html" | "text";

const initialHtml = "<h2>Dango blog editor</h2><p>Try <strong>bold</strong> and a #hashtag, then &laquo;Image&raquo; to upload a local file.</p>";

export function App() {
  const [last, setLast] = useState<DangoEditorChange | null>(null);
  const [tab, setTab] = useState<Tab>("json");
  const onChange = useCallback((v: DangoEditorChange) => setLast(v), []);

  const out = useMemo(() => {
    if (!last) {
      return "";
    }
    if (tab === "json") {
      return JSON.stringify(last.json, null, 2);
    }
    if (tab === "html") {
      return last.html;
    }
    return last.text;
  }, [last, tab]);

  return (
    <div
      style={{
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: 24
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Playground (shared-dango-blog-editor)</h1>
      <p style={{ marginTop: 0, color: "#4b5563", fontSize: 14 }}>
        onChange: JSON / HTML / text — image uses a local object URL. Wire your own <code>uploadAdapter</code> in admin
        or client.
      </p>
      <DangoBlogEditor
        content={initialHtml}
        onChange={onChange}
        uploadAdapter={demoDataUrl}
        className="playground"
      />
      <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Output</span>
        {(["json", "html", "text"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              fontSize: 12,
              padding: "2px 8px",
              border: `1px solid ${tab === t ? "#0b6" : "#c8d0d8"}`,
              borderRadius: 4,
              background: tab === t ? "#ecfeff" : "#fff",
              cursor: "pointer"
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <pre
        style={{
          fontSize: 12,
          marginTop: 8,
          padding: 10,
          border: "1px solid #d8dee4",
          borderRadius: 6,
          background: "#0d1117",
          color: "#c9d1d9",
          minHeight: 200,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}
      >
        {out}
      </pre>
    </div>
  );
}
