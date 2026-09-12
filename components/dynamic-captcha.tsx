"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

type CaptchaProps = { locale: Locale; className?: string; value?: string; onChange?: (value: string) => void; onTokenChange?: (token: string) => void; onEnabledChange?: (enabled: boolean) => void };

export function useCaptcha(locale: Locale) {
  const [challenge, setChallenge] = useState<{ question: string; token: string } | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const fetchChallenge = useCallback(async () => {
    const response = await fetch(`/api/captcha?locale=${locale}`, { cache: "no-store" });
    if (response.ok) return await response.json() as { enabled: boolean; question?: string; token?: string };
    return null;
  }, [locale]);
  const refresh = useCallback(async () => { const value = await fetchChallenge(); if (value) { setEnabled(value.enabled); setChallenge(value.enabled && value.question && value.token ? { question: value.question, token: value.token } : null); } }, [fetchChallenge]);

  useEffect(() => {
    let active = true;
    void fetchChallenge().then((value) => { if (active && value) { setEnabled(value.enabled); setChallenge(value.enabled && value.question && value.token ? { question: value.question, token: value.token } : null); } });
    return () => { active = false; };
  }, [fetchChallenge]);
  return { enabled, challenge, refresh };
}

export function DynamicCaptcha({ locale, className = "business-field captcha-field", value, onChange, onTokenChange, onEnabledChange }: CaptchaProps) {
  const fa = locale === "fa";
  const { enabled, challenge, refresh } = useCaptcha(locale);
  useEffect(() => { onTokenChange?.(challenge?.token ?? ""); }, [challenge?.token, onTokenChange]);
  useEffect(() => { if (enabled !== null) onEnabledChange?.(enabled); }, [enabled, onEnabledChange]);
  // The callbacks are intentionally invoked once when the server reports the disabled state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (enabled === false) { onTokenChange?.("disabled"); onChange?.("0"); } }, [enabled]);

  if (enabled === false) return null;

  return (
    <label className={className}>
      <span>{fa ? "پرسش امنیتی" : "Security check"}{challenge ? `: ${challenge.question} =` : ""} *</span>
      <input name="captcha" required inputMode="numeric" autoComplete="off" value={value} onChange={event => onChange?.(event.target.value)} aria-label={fa ? "پاسخ پرسش امنیتی" : "Security answer"} />
      <input type="hidden" name="captcha_token" value={challenge?.token ?? ""} />
      <button type="button" className="captcha-refresh" onClick={() => void refresh()} aria-label={fa ? "پرسش جدید" : "New security question"}>↻</button>
    </label>
  );
}
