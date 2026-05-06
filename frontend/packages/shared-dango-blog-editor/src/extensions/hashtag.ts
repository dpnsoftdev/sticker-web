import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

const INPUT_END = /#[\p{L}\p{N}_]+$/u;
const PASTE_FRAGMENT = /#[\p{L}\p{N}_]+/gu;

/**
 * Wraps tokens like #tag in a mark for consistent styling. Not tied to any backend.
 */
export const Hashtag = Mark.create({
  name: "hashtag",

  addOptions() {
    return {
      HTMLAttributes: { class: "dango-e-hashtag" as string | undefined }
    };
  },

  parseHTML() {
    return [{ tag: "span[data-hashtag]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-hashtag": "true" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0
    ];
  },

  addInputRules() {
    return [
      markInputRule({
        find: INPUT_END,
        type: this.type
      })
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: PASTE_FRAGMENT,
        type: this.type
      })
    ];
  }
});
