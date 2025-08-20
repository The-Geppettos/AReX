import type { BookPageDetail } from "@shared/book";

export const indentFirstLine = (
  pageTransitionType: BookPageDetail["page_transition_type"] | undefined,
) => {
  if (!pageTransitionType) return true;
  return ["new_chapter", "line_break"].includes(pageTransitionType);
};

export class TextProcessor {
  private _text: string;

  private constructor(text: string) {
    this._text = text;
  }

  static fromText(text: string) {
    return new TextProcessor(text);
  }

  result() {
    return this._text;
  }

  splitLineBreak() {
    return this._text.split(/\s*\n\s*/);
  }

  trim() {
    return new TextProcessor(this._text.trim());
  }

  removeDuplicateSpaces() {
    return new TextProcessor(
      this._text.replace(
        /[ \t\f\r\v\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g,
        " ",
      ),
    );
  }

  removeDuplicateLineBreaks() {
    return new TextProcessor(this._text.replace(/\s*\n\s*/g, "\n"));
  }
}
