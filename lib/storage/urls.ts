const managedBuckets = new Set(["site-media", "job-resumes", "contact-attachments", "international-profiles", "representative-documents"]);

export function normalizeManagedMediaUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value, "https://local.invalid");
    const apiMatch = /^\/api\/files\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (apiMatch && managedBuckets.has(apiMatch[1])) {
      const path = apiMatch[2].split("/").filter(Boolean).map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/");
      return `/api/files/${apiMatch[1]}/${path}`;
    }
    const match = /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (!match || !managedBuckets.has(match[1])) return value;
    const path = match[2].split("/").filter(Boolean).map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/");
    return `/api/files/${match[1]}/${path}`;
  } catch {
    return value;
  }
}
