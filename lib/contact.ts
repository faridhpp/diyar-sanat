const digitMap: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function toLatinDigits(value: string) {
  return [...value].map((character) => digitMap[character] ?? character).join("");
}

export function normalizePhoneNumber(value: string) {
  const normalized = toLatinDigits(value).replace(/[^0-9+()\s-]/g, "").trim();
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 5 || digits.length > 15) return "";
  return normalized;
}

export function parsePhoneNumbers(value: string | null | undefined) {
  if (!value?.trim()) return [];
  let candidates: unknown[] = [];
  try {
    const parsed: unknown = JSON.parse(value);
    candidates = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    candidates = value.split(/[\n,]/);
  }
  return [...new Set(candidates
    .filter((candidate): candidate is string => typeof candidate === "string")
    .map(normalizePhoneNumber)
    .filter(Boolean))].slice(0, 10);
}

export function phoneHref(value: string) {
  return `tel:${value.replace(/[^0-9+]/g, "")}`;
}
