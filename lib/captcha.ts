import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 10 * 60;
const fallbackSecret = "diyar-sanat-development-captcha-secret";

function secret() {
  const value = process.env.CAPTCHA_SECRET || process.env.DATABASE_URL || fallbackSecret;
  if (process.env.NODE_ENV === "production" && !process.env.CAPTCHA_SECRET) {
    throw new Error("CAPTCHA_SECRET is required in production");
  }
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).trim();
}

export function createCaptcha() {
  const first = randomInt(2, 10);
  const second = randomInt(1, 10);
  const add = randomInt(0, 2) === 1;
  const answer = add ? first + second : first - second;
  const question = add ? `${first} + ${second}` : `${first} − ${second}`;
  const payload = Buffer.from(JSON.stringify({ answer, expires: Date.now() + TTL_SECONDS * 1000, nonce: randomInt(0, 1_000_000) })).toString("base64url");
  return { question, token: `${payload}.${sign(payload)}` };
}

export function verifyCaptcha(token: unknown, answer: unknown) {
  if (typeof token !== "string" || typeof answer !== "string" || token.length > 512) return false;
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = sign(payload);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { answer?: number; expires?: number };
    return Number.isInteger(data.answer) && typeof data.expires === "number" && data.expires > Date.now() && Number(normalizeDigits(answer)) === data.answer;
  } catch {
    return false;
  }
}
