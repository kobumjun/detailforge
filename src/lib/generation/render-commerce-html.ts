import type { VisualCategoryKey } from "@/lib/generation/visual-category";
import type { CommerceBlock, GenerationPayloadV2, TemplateId } from "./types";
import { voiceFor } from "./commerce-voice";

const CAT_MOOD: Record<
  VisualCategoryKey,
  { accent: string; accent2: string; warm: string }
> = {
  food: { accent: "#ea580c", accent2: "#16a34a", warm: "#fff7ed" },
  beauty: { accent: "#db2777", accent2: "#9333ea", warm: "#fdf2f8" },
  fashion: { accent: "#0f172a", accent2: "#475569", warm: "#f8fafc" },
  pet: { accent: "#ca8a04", accent2: "#65a30d", warm: "#fefce8" },
  tech: { accent: "#2563eb", accent2: "#0891b2", warm: "#eff6ff" },
  home: { accent: "#b45309", accent2: "#78716c", warm: "#fafaf9" },
  kids: { accent: "#ea580c", accent2: "#0ea5e9", warm: "#fffbeb" },
  general: { accent: "#334155", accent2: "#64748b", warm: "#f1f5f9" },
};

const TPL_SKIN: Record<
  TemplateId,
  { bg: string; fg: string; muted: string; surface: string; surface2: string; border: string }
> = {
  aurora: {
    bg: "linear-gradient(165deg,#070b12 0%,#0c1220 40%,#080d14 100%)",
    fg: "#f8fafc",
    muted: "rgba(248,250,252,0.62)",
    surface: "rgba(255,255,255,0.06)",
    surface2: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.1)",
  },
  minimal: {
    bg: "#ffffff",
    fg: "#0f172a",
    muted: "#64748b",
    surface: "#f8fafc",
    surface2: "#f1f5f9",
    border: "#e2e8f0",
  },
  editorial: {
    bg: "linear-gradient(180deg,#faf7f2 0%,#f5f0e8 100%)",
    fg: "#1c1917",
    muted: "#57534e",
    surface: "#fffefb",
    surface2: "#f5f0e6",
    border: "#d6d3d1",
  },
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hintTweakAccent(hint: string | undefined, fallback: string) {
  if (!hint) return fallback;
  const h = hint.toLowerCase();
  if (h.includes("골드") || h.includes("gold")) return "#b45309";
  if (h.includes("레드") || h.includes("red")) return "#dc2626";
  if (h.includes("네이비") || h.includes("navy")) return "#1e3a5f";
  if (h.includes("그린") || h.includes("green")) return "#15803d";
  return fallback;
}

function cssVars(
  template: TemplateId,
  category: VisualCategoryKey,
  colorHint?: string,
): string {
  const skin = TPL_SKIN[template];
  const mood = CAT_MOOD[category];
  const accent = hintTweakAccent(colorHint, mood.accent);
  return [
    `--df-bg:${skin.bg};`,
    `--df-fg:${skin.fg};`,
    `--df-muted:${skin.muted};`,
    `--df-surface:${skin.surface};`,
    `--df-surface2:${skin.surface2};`,
    `--df-border:${skin.border};`,
    `--df-accent:${accent};`,
    `--df-accent2:${mood.accent2};`,
    `--df-warm:${mood.warm};`,
  ].join("");
}

function iconCheck() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function iconShield() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
}

function renderBlock(
  b: CommerceBlock,
  _template: TemplateId,
  voice: ReturnType<typeof voiceFor>,
): string {
  switch (b.type) {
    case "hero_shelf": {
      const badges = b.badges
        .map(
          (x) =>
            `<span class="df-badge">${escapeHtml(x)}</span>`,
        )
        .join("");
      const img = b.imageUrl
        ? `<div class="df-hero-img"><img src="${escapeHtml(b.imageUrl)}" alt="" crossorigin="anonymous" /></div>`
        : `<div class="df-ph df-hero-ph">히어로 이미지</div>`;
      return `<section class="df-sec df-hero">
        <p class="df-eyebrow">오늘의 픽</p>
        <div class="df-badge-row">${badges}</div>
        <h1 class="df-display">${escapeHtml(b.headline)}</h1>
        <p class="df-subhead">${escapeHtml(b.subcopy)}</p>
        ${img}
      </section>`;
    }
    case "trust_strip": {
      const cells = b.items
        .map(
          (it) => `<div class="df-trust-cell">
          <div class="df-trust-ic">${iconShield()}</div>
          <p class="df-trust-t">${escapeHtml(it.title)}</p>
          ${it.sub ? `<p class="df-trust-s">${escapeHtml(it.sub)}</p>` : ""}
        </div>`,
        )
        .join("");
      return `<section class="df-sec df-trust"><div class="df-trust-grid">${cells}</div></section>`;
    }
    case "pain_panel":
      return `<section class="df-sec df-pain">
        <div class="df-pain-inner">
          <p class="df-eyebrow">${escapeHtml(b.eyebrow)}</p>
          <h2 class="df-sectitle">${escapeHtml(b.title)}</h2>
          <p class="df-body">${escapeHtml(b.body)}</p>
          ${b.tag ? `<span class="df-tag">${escapeHtml(b.tag)}</span>` : ""}
        </div>
      </section>`;
    case "feature_grid": {
      const cls = b.columns === 3 ? "df-fgrid df-fgrid-3" : "df-fgrid df-fgrid-2";
      const cards = b.items
        .map(
          (it, i) => `<div class="df-fcard">
          ${it.n ? `<span class="df-fnum">${escapeHtml(it.n)}</span>` : `<span class="df-fnum">${i + 1}</span>`}
          <h3 class="df-fcard-t">${escapeHtml(it.title)}</h3>
          <p class="df-fcard-b">${escapeHtml(it.body)}</p>
        </div>`,
        )
        .join("");
      return `<section class="df-sec"><h2 class="df-sectitle df-center">핵심 포인트</h2><p class="df-body df-center df-mb">한눈에 보는 구성과 장점입니다.</p><div class="${cls}">${cards}</div></section>`;
    }
    case "fullbleed_visual": {
      const inner = b.imageUrl
        ? `<img src="${escapeHtml(b.imageUrl)}" alt="" crossorigin="anonymous" />`
        : `<div class="df-ph df-fb-ph">상세 비주얼</div>`;
      return `<section class="df-sec df-sec-tight">
        ${b.label ? `<p class="df-cap df-pad">${escapeHtml(b.label)}</p>` : ""}
        <div class="df-fullbleed">${inner}</div>
      </section>`;
    }
    case "stats_band": {
      const stats = b.stats
        .map(
          (s) => `<div class="df-stat"><span class="df-stat-v">${escapeHtml(s.value)}</span><span class="df-stat-l">${escapeHtml(s.label)}</span></div>`,
        )
        .join("");
      return `<section class="df-sec df-stats-sec"><div class="df-stats">${stats}</div></section>`;
    }
    case "checklist_icons": {
      const rows = b.items
        .map(
          (line) => `<div class="df-chk-row"><span class="df-chk-ic">${iconCheck()}</span><span class="df-chk-t">${escapeHtml(line)}</span></div>`,
        )
        .join("");
      return `<section class="df-sec"><div class="df-chk-box">
        <h2 class="df-sectitle">${escapeHtml(b.title)}</h2>
        ${rows}
      </div></section>`;
    }
    case "compare_table": {
      const head = `<tr><th>항목</th><th>${escapeHtml(voice.compareColOurs)}</th><th>${escapeHtml(voice.compareColTypical)}</th></tr>`;
      const rows = b.rows
        .map(
          (r) =>
            `<tr><td>${escapeHtml(r.label)}</td><td class="df-td-strong">${escapeHtml(r.ours)}</td><td>${escapeHtml(r.typical)}</td></tr>`,
        )
        .join("");
      return `<section class="df-sec"><h2 class="df-sectitle">${escapeHtml(b.title)}</h2>
        <div class="df-table-wrap"><table class="df-table">${head}${rows}</table></div></section>`;
    }
    case "quote_review":
      return `<section class="df-sec"><div class="df-quote">
        <p class="df-quote-t">“${escapeHtml(b.quote)}”</p>
        <p class="df-quote-a">— ${escapeHtml(b.author)}</p>
      </div></section>`;
    case "scenario_split":
      return `<section class="df-sec df-split">
        <div class="df-split-main">
          <p class="df-eyebrow">${escapeHtml(b.eyebrow)}</p>
          <h2 class="df-sectitle">${escapeHtml(b.title)}</h2>
          <p class="df-body">${escapeHtml(b.body)}</p>
        </div>
        ${b.aside ? `<aside class="df-split-aside"><p class="df-aside-t">TIP</p><p class="df-aside-b">${escapeHtml(b.aside)}</p></aside>` : ""}
      </section>`;
    case "recommend_banner":
      return `<section class="df-sec df-rec">
        <h2 class="df-rec-t">${escapeHtml(b.title)}</h2>
        <p class="df-rec-b">${escapeHtml(b.body)}</p>
      </section>`;
    case "composition_cards": {
      const cards = b.items
        .map(
          (x) => `<div class="df-comp-card"><span class="df-comp-dot"></span>${escapeHtml(x)}</div>`,
        )
        .join("");
      return `<section class="df-sec"><h2 class="df-sectitle">${escapeHtml(b.title)}</h2><div class="df-comp-grid">${cards}</div></section>`;
    }
    case "notice_box": {
      const lines = b.lines
        .map((l) => `<li class="df-li">${escapeHtml(l)}</li>`)
        .join("");
      return `<section class="df-sec"><div class="df-notice">
        <p class="df-notice-h">${escapeHtml(b.title)}</p>
        <ul class="df-ul">${lines}</ul>
      </div></section>`;
    }
    case "cta_band":
      return `<section class="df-sec df-cta-sec">
        <h2 class="df-cta-h">${escapeHtml(b.title)}</h2>
        <p class="df-cta-sub">${escapeHtml(b.body)}</p>
        <a class="df-cta-btn" href="#">${escapeHtml(b.buttonLabel)}</a>
      </section>`;
    default:
      return "";
  }
}

export function renderCommerceDetailDocument(
  payload: GenerationPayloadV2,
  widthPx = 800,
): string {
  const voice = voiceFor(payload.categoryKey);
  const vars = cssVars(
    payload.options.template,
    payload.categoryKey,
    payload.options.colorHint,
  );
  const blocksHtml = payload.blocks
    .map((b) => renderBlock(b, payload.options.template, voice))
    .join("\n");

  const tplClass = `df-tpl-${payload.options.template}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body.${tplClass} {
      font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif;
      background: var(--df-bg);
      color: var(--df-fg);
      width: ${widthPx}px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
      ${vars}
    }
    .df-wrap { padding-bottom: 48px; }
    .df-brand {
      padding: 28px 36px 8px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--df-muted);
    }
    .df-sec { padding: 40px 36px; border-bottom: 1px solid var(--df-border); }
    .df-sec-tight { padding-top: 24px; padding-bottom: 24px; }
    .df-display {
      font-size: 30px;
      font-weight: 800;
      line-height: 1.18;
      letter-spacing: -0.04em;
      margin-top: 12px;
    }
    .df-subhead {
      margin-top: 16px;
      font-size: 16px;
      line-height: 1.75;
      font-weight: 500;
      color: var(--df-muted);
      max-width: 38em;
    }
    .df-eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--df-accent);
    }
    .df-sectitle {
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.3;
      margin-bottom: 10px;
      color: var(--df-fg);
    }
    .df-body {
      font-size: 15px;
      line-height: 1.85;
      font-weight: 500;
      color: var(--df-muted);
      max-width: 40em;
    }
    .df-cap { font-size: 12px; font-weight: 600; color: var(--df-muted); }
    .df-pad { padding: 0 36px; }
    .df-center { text-align: center; margin-left: auto; margin-right: auto; }
    .df-mb { margin-bottom: 22px; }
    .df-badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .df-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: var(--df-surface2);
      color: var(--df-fg);
      border: 1px solid var(--df-border);
    }
    .df-tpl-aurora .df-badge {
      background: rgba(56,189,248,0.12);
      border-color: rgba(56,189,248,0.25);
      color: #e0f2fe;
    }
    .df-hero-img, .df-ph {
      margin-top: 26px;
      border-radius: 16px;
      overflow: hidden;
      background: var(--df-surface);
    }
    .df-hero-img img, .df-fullbleed img { display: block; width: 100%; height: auto; }
    .df-hero-ph { min-height: 320px; display: flex; align-items: center; justify-content: center; color: var(--df-muted); font-size: 13px; font-weight: 600; }
    .df-trust-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .df-trust-cell {
      padding: 16px 12px;
      border-radius: 14px;
      background: var(--df-surface);
      border: 1px solid var(--df-border);
      text-align: center;
    }
    .df-trust-ic { color: var(--df-accent); display: flex; justify-content: center; margin-bottom: 8px; }
    .df-trust-t { font-size: 13px; font-weight: 800; letter-spacing: -0.02em; }
    .df-trust-s { font-size: 11px; color: var(--df-muted); margin-top: 4px; line-height: 1.4; }
    .df-pain-inner {
      padding: 22px 22px 22px 26px;
      border-left: 4px solid var(--df-accent);
      border-radius: 0 14px 14px 0;
      background: var(--df-warm);
    }
    .df-tpl-aurora .df-pain-inner { background: rgba(255,255,255,0.04); }
    .df-tag {
      display: inline-block;
      margin-top: 14px;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #fff;
      background: var(--df-accent);
      border-radius: 4px;
    }
    .df-fgrid { display: grid; gap: 12px; }
    .df-fgrid-2 { grid-template-columns: repeat(2,1fr); }
    .df-fgrid-3 { grid-template-columns: repeat(3,1fr); }
    .df-fcard {
      padding: 18px 16px;
      border-radius: 14px;
      background: var(--df-surface);
      border: 1px solid var(--df-border);
      position: relative;
    }
    .df-fnum {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      color: var(--df-accent);
      margin-bottom: 8px;
    }
    .df-fcard-t { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
    .df-fcard-b { font-size: 13px; line-height: 1.65; color: var(--df-muted); }
    .df-fullbleed {
      margin-left: -36px;
      margin-right: -36px;
      width: calc(100% + 72px);
    }
    .df-fb-ph { min-height: 280px; display: flex; align-items: center; justify-content: center; color: var(--df-muted); }
    .df-stats-sec { background: var(--df-surface); }
    .df-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; text-align: center; }
    .df-stat-v { display: block; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; color: var(--df-accent); }
    .df-stat-l { font-size: 11px; color: var(--df-muted); margin-top: 4px; display: block; }
    .df-chk-box {
      padding: 22px;
      border-radius: 16px;
      border: 1px solid var(--df-border);
      background: var(--df-surface);
    }
    .df-chk-row { display: flex; gap: 12px; align-items: flex-start; margin-top: 12px; font-size: 14px; line-height: 1.55; }
    .df-chk-ic { color: var(--df-accent); flex-shrink: 0; margin-top: 2px; }
    .df-table-wrap { overflow: hidden; border-radius: 12px; border: 1px solid var(--df-border); margin-top: 16px; }
    .df-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .df-table th, .df-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--df-border); }
    .df-table th { background: var(--df-surface2); font-weight: 800; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--df-muted); }
    .df-td-strong { font-weight: 700; color: var(--df-accent); }
    .df-quote {
      padding: 28px 24px;
      border-radius: 16px;
      background: var(--df-surface);
      border: 1px solid var(--df-border);
    }
    .df-quote-t { font-size: 16px; line-height: 1.75; font-weight: 600; font-style: italic; color: var(--df-fg); }
    .df-quote-a { margin-top: 14px; font-size: 12px; color: var(--df-muted); font-weight: 600; }
    .df-split { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
    .df-split-aside {
      padding: 18px;
      border-radius: 14px;
      background: var(--df-accent);
      color: #fff;
    }
    .df-tpl-minimal .df-split-aside { color: #fff; }
    .df-aside-t { font-size: 10px; font-weight: 800; letter-spacing: 0.15em; opacity: 0.85; }
    .df-aside-b { margin-top: 8px; font-size: 13px; line-height: 1.6; font-weight: 600; }
    .df-rec {
      text-align: center;
      background: linear-gradient(135deg, var(--df-surface) 0%, var(--df-warm) 100%);
      border-radius: 16px;
      margin-left: 36px;
      margin-right: 36px;
      width: calc(100% - 72px);
      border: 1px solid var(--df-border);
    }
    .df-tpl-aurora .df-rec { background: linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.06)); }
    .df-rec-t { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; }
    .df-rec-b { margin-top: 10px; font-size: 14px; color: var(--df-muted); line-height: 1.65; max-width: 32em; margin-left: auto; margin-right: auto; }
    .df-comp-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 16px; }
    .df-comp-card {
      padding: 14px;
      border-radius: 12px;
      background: var(--df-surface);
      border: 1px solid var(--df-border);
      font-size: 13px;
      font-weight: 600;
      display: flex; align-items: center; gap: 10px;
    }
    .df-comp-dot { width: 8px; height: 8px; border-radius: 99px; background: var(--df-accent); flex-shrink: 0; }
    .df-notice {
      padding: 20px;
      border-radius: 14px;
      background: var(--df-surface2);
      border: 1px dashed var(--df-border);
    }
    .df-notice-h { font-size: 13px; font-weight: 800; margin-bottom: 10px; }
    .df-ul { list-style: none; padding: 0; }
    .df-li { font-size: 12px; color: var(--df-muted); line-height: 1.65; margin-top: 6px; padding-left: 14px; position: relative; }
    .df-li::before { content: "·"; position: absolute; left: 0; font-weight: 800; color: var(--df-accent); }
    .df-cta-sec {
      text-align: center;
      padding: 48px 36px 56px;
      border-bottom: none;
      background: linear-gradient(180deg, transparent, var(--df-surface));
    }
    .df-cta-h { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }
    .df-cta-sub { margin-top: 12px; font-size: 14px; color: var(--df-muted); line-height: 1.7; max-width: 30em; margin-left: auto; margin-right: auto; }
    .df-cta-btn {
      display: inline-block;
      margin-top: 22px;
      padding: 16px 44px;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.02em;
      text-decoration: none;
      background: var(--df-accent);
      color: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .df-tpl-minimal .df-cta-btn { background: var(--df-fg); color: #fff; }
  </style>
</head>
<body class="${tplClass}">
  <div class="df-wrap">
    <div class="df-brand">DetailForge</div>
    ${blocksHtml}
  </div>
</body>
</html>`;
}
