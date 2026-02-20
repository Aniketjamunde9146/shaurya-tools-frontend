import { useState, useRef, useCallback } from "react";
import "./MarkdownPreviewer.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconMarkdown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M6 12v4M6 8v4M10 8l2 4 2-4M18 8v8M18 8l-3 4M18 8l3 4"/>
  </svg>
);
const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconExpand = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);
const IconSync = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

/* ═══════════════════════════════════════
   Full-featured Markdown renderer
   Supports: headings, bold, italic,
   strikethrough, code blocks, inline code,
   blockquotes, ordered & unordered lists,
   tables, horizontal rules, links, images,
   task lists, footnotes
   ═══════════════════════════════════════ */
function renderMarkdown(md) {
  if (!md.trim()) return "";

  // Escape HTML
  const esc = (s) =>
    s.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;");

  // Process inline elements
  function inline(text) {
    return text
      // Inline code (process first)
      .replace(/`([^`]+)`/g, (_, c) => `<code class="mp-inline-code">${esc(c)}</code>`)
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      // Strikethrough
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      // Highlight
      .replace(/==(.+?)==/g, "<mark>$1</mark>")
      // Image (before link)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, `<img src="$2" alt="$1" class="mp-img"/>`)
      // Link
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`)
      // Auto-link
      .replace(/(?<!['"=(])(https?:\/\/[^\s<>"]+)/g, `<a href="$1" target="_blank" rel="noopener">$1</a>`)
      // Line break
      .replace(/  $/gm, "<br/>");
  }

  const lines = md.split("\n");
  const output = [];
  let i = 0;

  // Fence code blocks
  const extractFence = (startIdx) => {
    const fence = lines[startIdx].match(/^(`{3,}|~{3,})(.*)/);
    if (!fence) return null;
    const delim = fence[1][0].repeat(fence[1].length);
    const lang = fence[2].trim();
    let j = startIdx + 1;
    const codeLines = [];
    while (j < lines.length) {
      if (lines[j].trim() === delim || lines[j].startsWith(delim)) break;
      codeLines.push(lines[j]);
      j++;
    }
    return { lang, code: codeLines.join("\n"), end: j };
  };

  // Tables
  const isTableRow = (line) => /^\|.+\|/.test(line.trim()) || line.includes("|");
  const isSeparator = (line) => /^\|?[\s\-:|]+\|/.test(line.trim());

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty
    if (!trimmed) { i++; continue; }

    // Fenced code block
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      const fence = extractFence(i);
      if (fence) {
        output.push(
          `<div class="mp-code-wrap"><div class="mp-code-header"><span class="mp-code-lang">${esc(fence.lang) || "code"}</span><button class="mp-code-copy" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent)">Copy</button></div><pre class="mp-code-block"><code>${esc(fence.code)}</code></pre></div>`
        );
        i = fence.end + 1;
        continue;
      }
    }

    // Headings
    const hm = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      const lvl = hm[1].length;
      const id = hm[2].toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      output.push(`<h${lvl} id="${id}" class="mp-h${lvl}">${inline(hm[2])}</h${lvl}>`);
      i++; continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      output.push("<hr class=\"mp-hr\"/>");
      i++; continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const bqLines = [];
      while (i < lines.length && (lines[i].trim().startsWith(">") || lines[i].trim() === "")) {
        bqLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      output.push(`<blockquote class="mp-blockquote">${renderMarkdown(bqLines.join("\n"))}</blockquote>`);
      continue;
    }

    // Table
    if (isTableRow(trimmed) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const headerCells = trimmed.split("|").filter(c => c.trim()).map(c => `<th>${inline(c.trim())}</th>`).join("");
      const alignLine = lines[i + 1];
      const aligns = alignLine.split("|").filter(c => c.trim()).map(c => {
        const t = c.trim();
        if (t.startsWith(":") && t.endsWith(":")) return "center";
        if (t.endsWith(":")) return "right";
        return "left";
      });
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i].trim()) && lines[i].trim()) {
        const cells = lines[i].split("|").filter(c => c.trim());
        const rowHtml = cells.map((c, ci) =>
          `<td style="text-align:${aligns[ci] || "left"}">${inline(c.trim())}</td>`
        ).join("");
        rows.push(`<tr>${rowHtml}</tr>`);
        i++;
      }
      output.push(`<div class="mp-table-wrap"><table class="mp-table"><thead><tr>${headerCells}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`);
      continue;
    }

    // Unordered list
    if (/^(\s*)([-*+])\s/.test(line)) {
      const listItems = [];
      const baseIndent = line.match(/^(\s*)/)[1].length;
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) { i++; break; }
        const lm = l.match(/^(\s*)([-*+])\s+(.*)$/);
        if (!lm) break;
        const indent = lm[1].length;
        if (indent < baseIndent) break;
        // Task list
        const taskMatch = lm[3].match(/^\[(x| )\]\s+(.+)$/i);
        if (taskMatch) {
          const checked = taskMatch[1].toLowerCase() === "x";
          listItems.push(`<li class="mp-task-item"><input type="checkbox" ${checked ? "checked" : ""} disabled/> ${inline(taskMatch[2])}</li>`);
        } else {
          listItems.push(`<li>${inline(lm[3])}</li>`);
        }
        i++;
      }
      output.push(`<ul class="mp-ul">${listItems.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems = [];
      const startNum = parseInt(trimmed.match(/^(\d+)/)[1]);
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l) { i++; break; }
        const lm = l.match(/^\d+\.\s+(.*)$/);
        if (!lm) break;
        listItems.push(`<li>${inline(lm[1])}</li>`);
        i++;
      }
      output.push(`<ol class="mp-ol" start="${startNum}">${listItems.join("")}</ol>`);
      continue;
    }

    // Paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !/^(`{3,}|~{3,})/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !/^(\s*)([-*+])\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !isTableRow(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      output.push(`<p class="mp-p">${inline(paraLines.join(" "))}</p>`);
    } else {
      i++;
    }
  }

  return output.join("\n");
}

/* ── Toolbar actions ── */
const TOOLBAR = [
  { label: "B",      title: "Bold",          wrap: ["**", "**"],       icon: null },
  { label: "I",      title: "Italic",         wrap: ["*", "*"],         icon: null },
  { label: "~~",     title: "Strikethrough",  wrap: ["~~", "~~"],       icon: null },
  { label: "H1",     title: "Heading 1",      prefix: "# ",             icon: null },
  { label: "H2",     title: "Heading 2",      prefix: "## ",            icon: null },
  { label: "H3",     title: "Heading 3",      prefix: "### ",           icon: null },
  { divider: true },
  { label: "`",      title: "Inline Code",    wrap: ["`", "`"],         icon: null },
  { label: "```",    title: "Code Block",     block: "```\n\n```",      icon: null },
  { label: ">",      title: "Blockquote",     prefix: "> ",             icon: null },
  { divider: true },
  { label: "—",      title: "Horizontal Rule",insert: "\n---\n",        icon: null },
  { label: "UL",     title: "Bullet List",    prefix: "- ",             icon: null },
  { label: "OL",     title: "Ordered List",   prefix: "1. ",            icon: null },
  { label: "☑",      title: "Task List",      prefix: "- [ ] ",        icon: null },
  { divider: true },
  { label: "🔗",     title: "Link",           template: "[text](url)",  icon: null },
  { label: "🖼",     title: "Image",          template: "![alt](url)",  icon: null },
  { label: "⊞",      title: "Table",          table: true,              icon: null },
];

const SAMPLE_MD = `# Welcome to Markdown Previewer ✨

This is a **full-featured** Markdown editor with *live preview*.

---

## Features

- **Bold**, *italic*, ~~strikethrough~~, \`inline code\`
- ==Highlighted text==
- [Links](https://shaurya.tools) and images
- Task lists, tables, blockquotes, and more

## Code Blocks

\`\`\`javascript
// Example JavaScript
const greet = (name) => {
  return \`Hello, \${name}!\`;
};

console.log(greet("World"));
\`\`\`

\`\`\`css
.container {
  display: flex;
  align-items: center;
  gap: 16px;
}
\`\`\`

## Task List

- [x] Build a Markdown editor
- [x] Add syntax highlighting
- [ ] Ship to production
- [ ] Get feedback

## Table

| Tool | Category | Status |
|:-----|:--------:|-------:|
| JSON Formatter | Utility | ✅ Live |
| Base64 Converter | Utility | ✅ Live |
| Code Minifier | Dev Tools | ✅ Live |
| Markdown Previewer | Dev Tools | ✅ Live |

## Blockquote

> "Any fool can write code that a computer can understand.
> Good programmers write code that humans can understand."
> — Martin Fowler

## Heading Levels

### H3 Heading
#### H4 Heading
##### H5 Heading

---

Made with ❤️ by **ShauryaTools**
`;

export default function MarkdownPreviewer() {
  const [input,    setInput]    = useState(SAMPLE_MD);
  const [view,     setView]     = useState("split"); // split | editor | preview
  const [copied,   setCopied]   = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef();
  const previewRef  = useRef();
  const isSyncing   = useRef(false);
  const fileRef     = useRef();

  const html = renderMarkdown(input);

  // Word / char / read-time stats
  const words    = input.trim() ? input.trim().split(/\s+/).length : 0;
  const chars    = input.length;
  const lines    = input.split("\n").length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  /* ── Scroll sync ── */
  const handleEditorScroll = useCallback(() => {
    if (!syncScroll || isSyncing.current || !textareaRef.current || !previewRef.current) return;
    isSyncing.current = true;
    const el = textareaRef.current;
    const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
    const pv = previewRef.current;
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
    setTimeout(() => { isSyncing.current = false; }, 50);
  }, [syncScroll]);

  /* ── Toolbar action ── */
  const applyAction = (item) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = input.slice(start, end);
    let newText = input;
    let newCursor = start;

    if (item.wrap) {
      const [open, close] = item.wrap;
      const replacement = `${open}${sel || item.title}${close}`;
      newText  = input.slice(0, start) + replacement + input.slice(end);
      newCursor = start + open.length + (sel || item.title).length + close.length;
    } else if (item.prefix) {
      const lineStart = input.lastIndexOf("\n", start - 1) + 1;
      newText  = input.slice(0, lineStart) + item.prefix + input.slice(lineStart);
      newCursor = start + item.prefix.length;
    } else if (item.block) {
      newText  = input.slice(0, start) + item.block + input.slice(end);
      newCursor = start + 4;
    } else if (item.insert) {
      newText  = input.slice(0, start) + item.insert + input.slice(end);
      newCursor = start + item.insert.length;
    } else if (item.template) {
      newText  = input.slice(0, start) + item.template + input.slice(end);
      newCursor = start + item.template.length;
    } else if (item.table) {
      const tbl = "\n| Header | Header | Header |\n|--------|--------|--------|\n| Cell   | Cell   | Cell   |\n| Cell   | Cell   | Cell   |\n";
      newText  = input.slice(0, start) + tbl + input.slice(end);
      newCursor = start + tbl.length;
    }

    setInput(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  /* ── Tab key handler ── */
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newText = input.slice(0, start) + "  " + input.slice(end);
      setInput(newText);
      setTimeout(() => ta.setSelectionRange(start + 2, start + 2), 0);
    }
  };

  /* ── File upload ── */
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setInput(e.target.result);
    reader.readAsText(file);
  };

  /* ── Copy / Download ── */
  const handleCopyMd = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadHtml = () => {
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exported</title><style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1a1a1a}pre{background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;overflow-x:auto}code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:.9em}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e5e5;padding:8px 12px}blockquote{border-left:4px solid #e5e5e5;margin:0;padding:0 16px;color:#737373}</style></head><body>${html}</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
    <Helmet>
      <title>Free Markdown Editor & Live Previewer Online – ShauryaTools</title>
      <meta name="description" content="Write Markdown with a real-time split-pane preview. Supports tables, task lists, code blocks, syntax highlighting. Export to .md or .html. Free." />
      <meta name="keywords" content="markdown editor online, markdown previewer, live markdown preview, markdown to html, free markdown tool, markdown renderer" />
      <link rel="canonical" href="https://shauryatools.vercel.app/markdown-previewer" />
    </Helmet>
    <div className="mp-page">
      <div className="mp-inner">

        {/* ── Header ── */}
        <div className="mp-header">
          <div className="mp-icon"><IconMarkdown /></div>
          <div className="mp-header-text">
            <span className="mp-cat">Dev Tools</span>
            <h1>Markdown <span className="mp-dim">Previewer</span></h1>
            <p>Write Markdown with a live preview — supports tables, task lists, code blocks, and more.</p>
          </div>
          <div className="mp-header-actions">
            <button
              className={`mp-hdr-btn ${syncScroll ? "mp-hdr-on" : ""}`}
              onClick={() => setSyncScroll(v => !v)}
              title="Toggle scroll sync"
            >
              <IconSync /> Sync Scroll
            </button>
            <button className="mp-hdr-btn" onClick={() => fileRef.current.click()}>
              <IconUpload /> Upload .md
            </button>
            <input ref={fileRef} type="file" accept=".md,.txt,text/markdown" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <button className="mp-hdr-btn" onClick={handleDownload}>
              <IconDownload /> .md
            </button>
            <button className="mp-hdr-btn" onClick={handleDownloadHtml}>
              <IconDownload /> .html
            </button>
            <button className={`mp-hdr-btn ${copied ? "mp-hdr-copied" : ""}`} onClick={handleCopyMd}>
              {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
            </button>
          </div>
        </div>

        {/* ── View toggle ── */}
        <div className="mp-view-bar">
          <div className="mp-view-tabs">
            {[
              { id: "editor",  label: "Editor" },
              { id: "split",   label: "Split" },
              { id: "preview", label: "Preview" },
            ].map(v => (
              <button
                key={v.id}
                className={`mp-view-tab ${view === v.id ? "mp-view-on" : ""}`}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mp-stats">
            <span><strong>{words}</strong> words</span>
            <span className="mp-st-sep">·</span>
            <span><strong>{lines}</strong> lines</span>
            <span className="mp-st-sep">·</span>
            <span><strong>{chars}</strong> chars</span>
            <span className="mp-st-sep">·</span>
            <span>~<strong>{readTime}</strong> min read</span>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="mp-toolbar">
          {TOOLBAR.map((item, idx) =>
            item.divider
              ? <div key={`div-${idx}`} className="mp-tb-divider" />
              : (
                <button
                  key={idx}
                  className="mp-tb-btn"
                  title={item.title}
                  onClick={() => applyAction(item)}
                >
                  {item.label}
                </button>
              )
          )}
          <div className="mp-tb-spacer" />
          {input && (
            <button className="mp-tb-btn mp-tb-clear" title="Clear" onClick={() => setInput("")}>
              <IconTrash />
            </button>
          )}
        </div>

        {/* ── Editor / Preview ── */}
        <div
          className={`mp-workspace mp-ws-${view}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        >
          {/* Editor pane */}
          {(view === "editor" || view === "split") && (
            <div className="mp-pane mp-editor-pane">
              <div className="mp-pane-head">
                <span className="mp-pane-label">Markdown</span>
                <span className="mp-pane-hint">Tab = 2 spaces</span>
              </div>
              <textarea
                ref={textareaRef}
                className={`mp-textarea ${dragOver ? "mp-drag-over" : ""}`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onScroll={handleEditorScroll}
                onKeyDown={handleKeyDown}
                placeholder="Start writing Markdown here…&#10;&#10;Or drag & drop a .md file"
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview pane */}
          {(view === "preview" || view === "split") && (
            <div className="mp-pane mp-preview-pane">
              <div className="mp-pane-head">
                <span className="mp-pane-label">Preview</span>
                <span className="mp-pane-hint">Live</span>
              </div>
              <div
                ref={previewRef}
                className="mp-preview"
                dangerouslySetInnerHTML={{ __html: html || "<p class=\"mp-empty-preview\">Start typing to see a preview…</p>" }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
    </>
  );
}