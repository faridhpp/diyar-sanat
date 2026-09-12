"use client";

/* eslint-disable @next/next/no-img-element -- the preview can be a legacy or blob URL */
import { useEffect, useId, useRef, useState } from "react";
import { normalizeManagedMediaUrl } from "@/lib/storage/urls";

type UploadStatus = "idle" | "uploading" | "success" | "error";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function isImageUrl(value: string) {
  return /\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(value);
}

function fileName(value: string) {
  if (!value) return "فایلی انتخاب نشده است";
  try {
    return decodeURIComponent(new URL(value, "https://local.invalid").pathname.split("/").at(-1) || value);
  } catch {
    return value.split("/").at(-1) || value;
  }
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminUploadField({ name, label, folder, accept, defaultValue = "" }: { name: string; label: string; folder: string; accept: string; defaultValue?: string }) {
  const normalizedDefault = normalizeManagedMediaUrl(defaultValue);
  const [value, setValue] = useState(normalizedDefault);
  const [preview, setPreview] = useState(isImageUrl(normalizedDefault) ? normalizedDefault : "");
  const [displayName, setDisplayName] = useState(fileName(normalizedDefault));
  const [selectedSize, setSelectedSize] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const localPreviewRef = useRef<string | null>(null);
  const inputId = `admin-upload-${useId().replace(/:/g, "")}`;

  useEffect(() => () => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    xhrRef.current?.abort();
  }, []);

  function setLocalPreview(file: File) {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    if (!file.type.startsWith("image/")) {
      localPreviewRef.current = null;
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    localPreviewRef.current = url;
    setPreview(url);
  }

  function upload(file?: File) {
    if (!file) return;
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setStatus("error");
      setError("حجم فایل باید بیشتر از صفر و حداکثر ۱۵ مگابایت باشد.");
      return;
    }
    setError("");
    setStatus("uploading");
    setProgress(0);
    setDisplayName(file.name);
    setSelectedSize(file.size);
    setLocalPreview(file);

    const body = new FormData();
    body.set("file", file);
    body.set("folder", folder);
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/admin/uploads");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      xhrRef.current = null;
      try {
        const result = JSON.parse(xhr.responseText) as { url?: string };
        if (xhr.status < 200 || xhr.status >= 300 || !result.url) throw new Error();
        const nextValue = normalizeManagedMediaUrl(result.url);
        setValue(nextValue);
        setPreview(isImageUrl(nextValue) ? nextValue : "");
        setProgress(100);
        setStatus("success");
      } catch {
        setStatus("error");
        setError("بارگذاری انجام نشد؛ نوع یا حجم فایل را بررسی کنید.");
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      setStatus("error");
      setError("ارتباط با سرور هنگام بارگذاری قطع شد.");
    };
    xhr.onabort = () => {
      xhrRef.current = null;
      setStatus("idle");
      setProgress(0);
    };
    xhr.send(body);
  }

  function clearFile() {
    xhrRef.current?.abort();
    setValue("");
    setPreview("");
    setDisplayName("فایلی انتخاب نشده است");
    setSelectedSize(0);
    setProgress(0);
    setStatus("idle");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    inputRef.current?.click();
  }

  return (
    <div className={`admin-upload-field ${dragging ? "is-dragging" : ""} ${status === "uploading" ? "is-uploading" : ""}`}>
      <div className="admin-upload-heading">
        <span>{label}</span>
        <small>حداکثر ۱۵ مگابایت · {accept.replaceAll("image/", "").replaceAll("application/", "")}</small>
      </div>
      <input ref={inputRef} id={inputId} className="admin-upload-native" type="file" accept={accept} onChange={(event) => upload(event.target.files?.[0])} />
      <input type="hidden" name={name} value={value} />
      <div
        className="admin-upload-dropzone"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files?.[0]); }}
      >
        <div className={`admin-upload-preview ${preview ? "has-image" : ""}`}>
          {preview ? <img src={preview} alt="" /> : <span aria-hidden="true">↑</span>}
        </div>
        <div className="admin-upload-summary">
          <strong>{status === "uploading" ? `در حال بارگذاری… ${progress}%` : displayName}</strong>
          <small>{selectedSize ? formatBytes(selectedSize) : "برای انتخاب فایل کلیک کنید یا آن را اینجا رها کنید"}</small>
        </div>
        <div className="admin-upload-actions">
          <button type="button" onClick={openPicker} disabled={status === "uploading"}>
            {status === "uploading" ? "در حال ارسال…" : value ? "تعویض فایل" : "انتخاب فایل"}
          </button>
          {value && status !== "uploading" ? <button type="button" className="secondary" onClick={(event) => { event.stopPropagation(); clearFile(); }}>حذف انتخاب</button> : null}
        </div>
      </div>
      {status === "uploading" ? (
        <div className="admin-upload-progress" role="status" aria-live="polite">
          <div className="admin-upload-progress-label"><span>در حال آپلود به سرور</span><b>{progress}%</b></div>
          <div className="admin-upload-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <button type="button" onClick={() => xhrRef.current?.abort()}>لغو بارگذاری</button>
        </div>
      ) : null}
      {status === "success" ? <p className="admin-upload-success" role="status">فایل با موفقیت آپلود شد و آماده ذخیره فرم است.</p> : null}
      {error ? <p className="admin-upload-error" role="alert">{error}</p> : null}
    </div>
  );
}
