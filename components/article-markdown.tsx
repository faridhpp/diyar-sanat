import { headingId, parseMarkdownBlocks, tokenizeMarkdownInline } from "@/lib/markdown";
import styles from "./article-markdown.module.css";

type Section = { heading?: string; paragraphs: string[]; points?: string[] };

function Inline({ text }: { text: string }) {
  return <>{tokenizeMarkdownInline(text).map((token, index) => {
    if (token.type === "strong") return <strong key={index}>{token.text}</strong>;
    if (token.type === "em") return <em key={index}>{token.text}</em>;
    if (token.type === "code") return <code className={styles.code} key={index}>{token.text}</code>;
    if (token.type === "link") {
      const external = token.href.startsWith("https://");
      return <a className={styles.link} key={index} href={token.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{token.text}</a>;
    }
    return <span key={index}>{token.text}</span>;
  })}</>;
}

function Blocks({ source, keyPrefix }: { source: string; keyPrefix: string }) {
  return <>{parseMarkdownBlocks(source).map((block, index) => {
    const key = `${keyPrefix}-${index}`;
    if (block.type === "heading") {
      return block.level === 2
        ? <h2 id={block.id} key={key}><Inline text={block.text} /></h2>
        : <h3 className={styles.h3} id={block.id} key={key}><Inline text={block.text} /></h3>;
    }
    if (block.type === "paragraph") return <p key={key}><Inline text={block.text} /></p>;
    if (block.type === "image") return <figure className={styles.figure} key={key}><img src={block.src} alt={block.alt} loading="lazy" />{block.alt ? <figcaption>{block.alt}</figcaption> : null}</figure>;
    if (block.type === "list") {
      const items = block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}><Inline text={item} /></li>);
      return block.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>;
    }
    if (block.type === "quote") return <blockquote className={styles.quote} key={key}><Inline text={block.text} /></blockquote>;
    return <hr className={styles.rule} key={key} />;
  })}</>;
}

export function ArticleMarkdown({ sections }: { sections: Section[] }) {
  return <>{sections.map((section, sectionIndex) => {
    const id = section.heading ? headingId(section.heading, sectionIndex) : undefined;
    return <section id={id} className={styles.section} key={`${id ?? "section"}-${sectionIndex}`}>
      {section.heading ? <h2><Inline text={section.heading} /></h2> : null}
      {section.paragraphs.map((paragraph, paragraphIndex) => <Blocks source={paragraph} key={`${sectionIndex}-${paragraphIndex}`} keyPrefix={`${sectionIndex}-${paragraphIndex}`} />)}
      {section.points?.length ? <ul>{section.points.map((point, pointIndex) => <li key={pointIndex}><Inline text={point} /></li>)}</ul> : null}
    </section>;
  })}</>;
}
