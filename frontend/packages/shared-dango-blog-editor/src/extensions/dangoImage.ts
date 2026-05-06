import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DangoImageNodeView } from "../components/DangoImageNodeView";

const parsePx = (v: string | null): number | null => {
  if (!v) {
    return null;
  }
  if (/^\d+$/.test(v)) {
    return parseInt(v, 10);
  }
  const m = v.match(/^(\d+(?:\.\d+)?)px$/i);
  if (m) {
    return Math.round(parseFloat(m[1]));
  }
  return null;
};

/**
 * Block `image` với width/height/align trong attrs, NodeView tùy chỉnh: khung, resize, căn.
 */
export const DangoImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) {
            return null;
          }
          const a = element.getAttribute("width");
          if (a) {
            const n = parseInt(a, 10);
            if (!Number.isNaN(n)) {
              return n;
            }
          }
          return parsePx(element.style.width) ?? null;
        },
        renderHTML: (attributes) => {
          if (attributes.width == null) {
            return {};
          }
          return { width: String(attributes.width) };
        }
      },
      height: {
        default: null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) {
            return null;
          }
          const a = element.getAttribute("height");
          if (a) {
            const n = parseInt(a, 10);
            if (!Number.isNaN(n)) {
              return n;
            }
          }
          return parsePx(element.style.height) ?? null;
        },
        renderHTML: (attributes) => {
          if (attributes.height == null) {
            return {};
          }
          return { height: String(attributes.height) };
        }
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) {
            return "center";
          }
          const a = element.getAttribute("data-align");
          if (a === "left" || a === "right" || a === "center") {
            return a;
          }
          return "center";
        },
        renderHTML: (attributes) => ({
          "data-align": attributes.align != null && attributes.align !== "" ? String(attributes.align) : "center"
        })
      }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(DangoImageNodeView, {
      className: "dango-image-node-outer"
    });
  }
}).configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: { class: "dango-e-image" }
});
