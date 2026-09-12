"use client";

import { useRef, useState } from "react";
import { normalizeManagedMediaUrl } from "@/lib/storage/urls";

export function AdminUploadField({ name, label, folder, accept, defaultValue = "" }: { name: string; label: string; folder: string; accept: string; defaultValue?: string }) {
  const [value, setValue] = useState(normalizeManagedMediaUrl(defaultValue));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    const body = new FormData(); body.set("file", file); body.set("folder", folder);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      if (!response.ok) throw new Error();
      const result = await response.json() as { url: string };
      setValue(normalizeManagedMediaUrl(result.url));
    } catch { setError("بارگذاری انجام نشد؛ نوع یا حجم فایل را بررسی کنید."); }
    finally { setBusy(false); }
  }

  const filename = value ? new URL(value, "https://local.invalid").pathname.split("/").at(-1) : "حداکثر ۱۵ مگابایت";
  return <label className="admin-upload-field"><span>{label}</span><input type="hidden" name={name} value={value} /><span className="admin-upload-control"><button type="button" onClick={() => ref.current?.click()} disabled={busy}>{busy ? "در حال بارگذاری…" : value ? "جایگزینی فایل" : "انتخاب و بارگذاری"}</button><small dir="ltr">{filename}</small></span><input ref={ref} className="admin-upload-native" type="file" accept={accept} onChange={event => void upload(event.target.files?.[0])} />{error ? <em role="alert">{error}</em> : null}</label>;
}
