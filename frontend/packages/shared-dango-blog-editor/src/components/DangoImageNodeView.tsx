import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";

const MIN_W = 48;

type Align = "left" | "center" | "right";

function parseAlign(v: unknown): Align {
  if (v === "left" || v === "right" || v === "center") {
    return v;
  }
  return "center";
}

/**
 * Renders a block image with selection frame, corner resize, and L / C / R alignment.
 */
export function DangoImageNodeView({
  node,
  updateAttributes,
  selected,
  ref
}: ReactNodeViewProps) {
  const { src, alt, title, width, height, align: alignAttr } = node.attrs;
  const align = parseAlign(alignAttr);
  const imgRef = useRef<HTMLImageElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  const w = width != null && width !== "" ? Number(width) : undefined;
  const h = height != null && height !== "" ? Number(height) : undefined;

  const onAlign = (next: Align) => {
    updateAttributes({ align: next });
  };

  const onAlignMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const img = imgRef.current;
      if (!img) {
        return;
      }
      const startX = e.clientX;
      const startW = w ?? img.getBoundingClientRect().width;
      const pro = innerRef.current?.closest(".ProseMirror") as HTMLElement | null;
      const maxW = pro?.getBoundingClientRect().width
        ? Math.min(pro.getBoundingClientRect().width, 2000)
        : 2000;
      setResizing(true);
      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const next = Math.max(MIN_W, Math.min(maxW, startW + delta));
        updateAttributes({ width: Math.round(next), height: null });
      };
      const onUp = () => {
        setResizing(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [w, updateAttributes]
  );

  const imgStyle: React.CSSProperties = {
    maxWidth: "100%",
    height: "auto",
    display: "block"
  };
  if (h != null && !Number.isNaN(h) && w != null && !Number.isNaN(w)) {
    imgStyle.width = w;
    imgStyle.height = h;
  } else if (w != null && !Number.isNaN(w)) {
    imgStyle.width = w;
    imgStyle.maxWidth = "100%";
    imgStyle.height = "auto";
  } else {
    imgStyle.maxWidth = "100%";
    imgStyle.width = "auto";
    imgStyle.height = "auto";
  }

  const textAlign: React.CSSProperties["textAlign"] =
    align === "left" ? "left" : align === "right" ? "right" : "center";

  return (
    <NodeViewWrapper
      ref={ref as React.Ref<HTMLDivElement>}
      as="div"
      style={{ textAlign }}
      className={`dango-image-node dango-image-node--align-${align} ${selected ? "dango-image-node--selected" : ""} ${resizing ? "dango-image-node--resizing" : ""}`}
    >
      {selected ? (
        <div
          className="dango-image-node__alignBar"
          style={{
            justifyContent:
              align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"
          }}
          onMouseDown={onAlignMouseDown}
          role="group"
          aria-label="Căn ảnh"
        >
          <button
            type="button"
            className="dango-image-node__alignBtn"
            data-active={align === "left" || undefined}
            onMouseDown={onAlignMouseDown}
            onClick={() => onAlign("left")}
          >
            Trái
          </button>
          <button
            type="button"
            className="dango-image-node__alignBtn"
            data-active={align === "center" || undefined}
            onMouseDown={onAlignMouseDown}
            onClick={() => onAlign("center")}
          >
            Giữa
          </button>
          <button
            type="button"
            className="dango-image-node__alignBtn"
            data-active={align === "right" || undefined}
            onMouseDown={onAlignMouseDown}
            onClick={() => onAlign("right")}
          >
            Phải
          </button>
        </div>
      ) : null}
      <div
        className="dango-image-node__inner"
        ref={innerRef}
      >
        {selected || resizing ? (
          <div className="dango-image-node__frame" aria-hidden="true" />
        ) : null}
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          title={title || undefined}
          className="dango-e-image dango-image-node__img"
          style={imgStyle}
          draggable={false}
        />
        {selected ? (
          <button
            type="button"
            className="dango-image-node__handle"
            onMouseDown={onResizeStart}
            aria-label="Kéo để đổi kích thước"
          />
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}
