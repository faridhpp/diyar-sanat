const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function readAttributes(tag: string) {
  const attributes = new Map<string, string>();
  const expression = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(expression)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function safeHttpsUrl(value: string, allowInternal = false) {
  const trimmed = value.trim();
  if (allowInternal && trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function sanitizeCredentialHtml(input: string) {
  const tokens = input.match(/<\/?a\b[^>]*>|<img\b[^>]*\/?>/gi) ?? [];
  const output: string[] = [];
  let openAnchors = 0;

  for (const token of tokens) {
    if (/^<\/a/i.test(token)) {
      if (openAnchors > 0) {
        output.push("</a>");
        openAnchors -= 1;
      }
      continue;
    }

    const attributes = readAttributes(token);
    if (/^<a\b/i.test(token)) {
      const href = safeHttpsUrl(attributes.get("href") ?? "");
      if (!href) continue;
      const target = attributes.get("target") === "_self" ? "_self" : "_blank";
      const title = attributes.get("title");
      output.push(
        `<a href="${escapeAttribute(href)}" target="${target}" rel="noopener noreferrer" referrerpolicy="origin"${title ? ` title="${escapeAttribute(title)}"` : ""}>`,
      );
      openAnchors += 1;
      continue;
    }

    const src = safeHttpsUrl(attributes.get("src") ?? "", true);
    if (!src) continue;
    const alt = attributes.get("alt") ?? "";
    const title = attributes.get("title");
    output.push(
      `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async" referrerpolicy="origin" style="display:block;max-width:100%;max-height:82px;margin:auto;object-fit:contain"${title ? ` title="${escapeAttribute(title)}"` : ""}>`,
    );
  }

  while (openAnchors > 0) {
    output.push("</a>");
    openAnchors -= 1;
  }

  return output.join("");
}

export function normalizeMapEmbed(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const iframeSource = trimmed.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];
  const candidate = (iframeSource ?? trimmed).replaceAll("&amp;", "&");

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const googleMaps =
      (host === "google.com" || host.endsWith(".google.com")) && url.pathname.startsWith("/maps");
    const openStreetMap =
      (host === "openstreetmap.org" || host.endsWith(".openstreetmap.org")) &&
      url.pathname.startsWith("/export/embed.html");
    return googleMaps || openStreetMap ? url.toString() : null;
  } catch {
    return null;
  }
}
