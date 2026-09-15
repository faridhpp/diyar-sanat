"use client";

import { useRef, useState } from "react";
import { parseMarkdownBlocks, safeMarkdownUrl, tokenizeMarkdownInline } from "@/lib/markdown";
import styles from "./rich-markdown-editor.module.css";

type Props = {
  name: string;
  defaultValue?: string | null;
  locale: "fa" | "en";
};

function PreviewInline({ text }: { text: string }) {
  return <>{tokenizeMarkdownInline(text).map((token, index) => {
    if (token.type === "strong") return <strong key={index}>{token.text}</strong>;
    if (token.type === "em") return <em key={index}>{token.text}</em>;
    if (token.type === "code") return <code key={index}>{token.text}</code>;
    if (token.type === "link") return <a key={index} href={token.href} onClick={(event) => event.preventDefault()}>{token.text}</a>;
    return <span key={index}>{token.text}</span>;
  })}</>;
}

function Preview({ value }: { value: string }) {
  const blocks = parseMarkdownBlocks(value);
  if (!blocks.length) return <p className={styles.previewEmpty}>هنوز محتوایی نوشته نشده است.</p>;
  return <div className={styles.previewContent}>
    {blocks.map((block, index) => {
      if (block.type === "heading") return block.level === 2
        ? <h2 key={index}><PreviewInline text={block.text} /></h2>
        : <h3 key={index}><PreviewInline text={block.text} /></h3>;
      if (block.type === "paragraph") return <p key={index}><PreviewInline text={block.text} /></p>;
      if (block.type === "image") return <figure key={index}><img src={block.src} alt={block.alt} />{block.alt ? <figcaption>{block.alt}</figcaption> : null}</figure>;
      if (block.type === "list") {
        const items = block.items.map((item, itemIndex) => <li key={itemIndex}><PreviewInline text={item} /></li>);
        return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
      }
      if (block.type === "quote") return <blockquote key={index}><PreviewInline text={block.text} /></blockquote>;
      return <hr key={index} />;
    })}
  </div>;
}

export function RichMarkdownEditor({ name, defaultValue = "", locale }: Props) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fa = locale === "fa";

  const selection = () => {
    const element = textareaRef.current;
    return {
      start: element?.selectionStart ?? value.length,
      end: element?.selectionEnd ?? value.length,
    };
  };

  const focusSelection = (start: number, end: number) => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, end);
    });
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const { start, end } = selection();
    const chosen = value.slice(start, end) || placeholder;
    const replacement = `${before}${chosen}${after}`;
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    focusSelection(start + before.length, start + before.length + chosen.length);
  };

  const prefixLines = (prefix: string, placeholder: string) => {
    const { start, end } = selection();
    const chosen = value.slice(start, end) || placeholder;
    const replacement = chosen.split("\n").map((line) => `${prefix}${line}`).join("\n");
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    focusSelection(start, start + replacement.length);
  };

  const insertBlock = (block: string) => {
    const { start, end } = selection();
    const before = value.slice(0, start);
    const after = value.slice(end);
    const leading = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const trailing = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
    const replacement = `${leading}${block}${trailing}`;
    setValue(`${before}${replacement}${after}`);
    const cursor = before.length + replacement.length - trailing.length;
    focusSelection(cursor, cursor);
  };

  const addLink = () => {
    const { start, end } = selection();
    const selected = value.slice(start, end);
    const href = window.prompt(fa ? "آدرس لینک را وارد کنید" : "Enter link URL", "https://");
    if (!href) return;
    const safe = safeMarkdownUrl(href, "link");
    if (!safe) {
      setError(fa ? "لینک باید داخلی یا HTTPS باشد." : "Link must be internal or HTTPS.");
      return;
    }
    const label = selected || window.prompt(fa ? "متن لینک" : "Link text", fa ? "متن لینک" : "Link text") || safe;
    const replacement = `[${label}](${safe})`;
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    focusSelection(start + 1, start + 1 + label.length);
    setError("");
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", "editorial/body");
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      if (!response.ok) throw new Error();
      const result = await response.json() as { url: string };
      const alt = window.prompt(fa ? "متن جایگزین تصویر (Alt)" : "Image alt text", "") ?? "";
      insertBlock(`![${alt.replaceAll("]", "")}](${result.url})`);
    } catch {
      setError(fa ? "آپلود تصویر انجام نشد؛ نوع یا حجم فایل را بررسی کنید." : "Image upload failed. Check the file type or size.");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  return <div className={styles.editor} dir={fa ? "rtl" : "ltr"}>
    <div className={styles.topbar}>
      <div className={styles.modeSwitch}>
        <button type="button" className={mode === "edit" ? styles.active : ""} onClick={() => setMode("edit")}>{fa ? "ویرایش" : "Edit"}</button>
        <button type="button" className={mode === "preview" ? styles.active : ""} onClick={() => setMode("preview")}>{fa ? "پیش‌نمایش" : "Preview"}</button>
      </div>
      <small>{fa ? "ویرایشگر محتوای مقاله" : "Article content editor"}</small>
    </div>

    <div className={styles.toolbar} aria-label={fa ? "ابزارهای ویرایش متن" : "Editor tools"}>
      <button type="button" title="Heading 2" onClick={() => prefixLines("## ", fa ? "عنوان بخش" : "Section heading")}>H2</button>
      <button type="button" title="Heading 3" onClick={() => prefixLines("### ", fa ? "زیرعنوان" : "Subheading")}>H3</button>
      <button type="button" title={fa ? "پررنگ" : "Bold"} onClick={() => wrapSelection("**", "**", fa ? "متن پررنگ" : "Bold text")}><b>B</b></button>
      <button type="button" title={fa ? "کج" : "Italic"} onClick={() => wrapSelection("*", "*", fa ? "متن کج" : "Italic text")}><i>I</i></button>
      <button type="button" title={fa ? "لینک" : "Link"} onClick={addLink}>↗ {fa ? "لینک" : "Link"}</button>
      <button type="button" title={fa ? "تصویر" : "Image"} onClick={() => imageInputRef.current?.click()} disabled={uploading}>▧ {uploading ? (fa ? "آپلود…" : "Uploading…") : (fa ? "تصویر" : "Image")}</button>
      <button type="button" title={fa ? "لیست" : "Bulleted list"} onClick={() => prefixLines("- ", fa ? "آیتم لیست" : "List item")}>• {fa ? "لیست" : "List"}</button>
      <button type="button" title={fa ? "لیست شماره‌دار" : "Numbered list"} onClick={() => prefixLines("1. ", fa ? "آیتم لیست" : "List item")}>1. {fa ? "لیست" : "List"}</button>
      <button type="button" title={fa ? "نقل‌قول" : "Quote"} onClick={() => prefixLines("> ", fa ? "متن نقل‌قول" : "Quote")}>❝</button>
      <button type="button" title={fa ? "خط جداکننده" : "Divider"} onClick={() => insertBlock("---")}>—</button>
      <input ref={imageInputRef} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadImage(event.target.files?.[0])} />
    </div>

    {mode === "edit" ? (
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={18}
        className={styles.textarea}
        placeholder={fa ? "متن مقاله را بنویسید…" : "Write the article content…"}
      />
    ) : <Preview value={value} />}

    <input type="hidden" name={mode === "preview" ? name : `${name}_preview_shadow`} value={mode === "preview" ? value : ""} />
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <p className={styles.help}>{fa ? "از H2/H3 برای ساختار مقاله استفاده کنید. لینک‌ها و تصاویر در خروجی عمومی به‌صورت امن نمایش داده می‌شوند." : "Use H2/H3 to structure the article. Links and images are rendered safely on the public page."}</p>
  </div>;
}
