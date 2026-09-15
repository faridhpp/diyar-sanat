export type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" };

export type MarkdownInline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string };

export function safeMarkdownUrl(input: string, kind: "link" | "image" = "link") {
  const value = input.trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;
  if (kind === "link" && (value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:"))) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function headingId(text: string, fallbackIndex = 0) {
  const normalized = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `section-${fallbackIndex + 1}`;
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let quoteLines: string[] = [];
  let headingIndex = 0;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", ordered: listOrdered, items: listItems });
    listItems = [];
  };
  const flushQuote = () => {
    const text = quoteLines.join(" ").trim();
    if (text) blocks.push({ type: "quote", text });
    quoteLines = [];
  };
  const flushText = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushText();
      continue;
    }

    const heading = /^(##|###)\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushText();
      const text = heading[2].trim();
      blocks.push({ type: "heading", level: heading[1] === "##" ? 2 : 3, text, id: headingId(text, headingIndex++) });
      continue;
    }

    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (image) {
      const src = safeMarkdownUrl(image[2], "image");
      if (src) {
        flushText();
        blocks.push({ type: "image", src, alt: image[1].trim() });
        continue;
      }
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      flushText();
      blocks.push({ type: "hr" });
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unordered) {
      flushParagraph();
      flushQuote();
      if (listItems.length && listOrdered) flushList();
      listOrdered = false;
      listItems.push(unordered[1].trim());
      continue;
    }

    const ordered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listItems.length && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(ordered[1].trim());
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      quoteLines.push(quote[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushText();
  return blocks;
}

export function tokenizeMarkdownInline(text: string): MarkdownInline[] {
  const tokens: MarkdownInline[] = [];
  let remaining = text;
  const patterns = [
    { type: "link" as const, regex: /\[([^\]]+)\]\(([^)\s]+)\)/ },
    { type: "strong" as const, regex: /\*\*([^*]+)\*\*/ },
    { type: "code" as const, regex: /`([^`]+)`/ },
    { type: "em" as const, regex: /\*([^*]+)\*/ },
  ];

  while (remaining) {
    let best: { index: number; length: number; type: "link" | "strong" | "code" | "em"; match: RegExpExecArray } | undefined;
    for (const pattern of patterns) {
      const match = pattern.regex.exec(remaining);
      if (!match) continue;
      if (!best || match.index < best.index || (match.index === best.index && match[0].length > best.length)) {
        best = { index: match.index, length: match[0].length, type: pattern.type, match };
      }
    }

    if (!best) {
      tokens.push({ type: "text", text: remaining });
      break;
    }
    if (best.index > 0) tokens.push({ type: "text", text: remaining.slice(0, best.index) });

    if (best.type === "link") {
      const href = safeMarkdownUrl(best.match[2], "link");
      tokens.push(href ? { type: "link", text: best.match[1], href } : { type: "text", text: best.match[0] });
    } else if (best.type === "strong") {
      tokens.push({ type: "strong", text: best.match[1] });
    } else if (best.type === "code") {
      tokens.push({ type: "code", text: best.match[1] });
    } else {
      tokens.push({ type: "em", text: best.match[1] });
    }
    remaining = remaining.slice(best.index + best.length);
  }

  return tokens;
}
