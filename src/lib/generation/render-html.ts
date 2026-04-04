import type { GenerationPayload } from "./types";
import type { TemplateId } from "./types";

const templateStyles: Record<
  TemplateId,
  { bg: string; fg: string; muted: string; accent: string; card: string }
> = {
  aurora: {
    bg: "linear-gradient(180deg, #0b0f14 0%, #121a24 40%, #0e141c 100%)",
    fg: "#f4f6f8",
    muted: "rgba(244,246,248,0.65)",
    accent: "#7dd3fc",
    card: "rgba(255,255,255,0.06)",
  },
  minimal: {
    bg: "#ffffff",
    fg: "#111827",
    muted: "#6b7280",
    accent: "#111827",
    card: "#f9fafb",
  },
  editorial: {
    bg: "#faf7f2",
    fg: "#1c1917",
    muted: "#78716c",
    accent: "#b45309",
    card: "#fffefb",
  },
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDetailDocument(
  payload: GenerationPayload,
  widthPx = 800,
): string {
  const t = templateStyles[payload.options.template];
  const sectionsHtml = payload.sections
    .map((s) => {
      if (s.kind === "hero") {
        const img = s.imageUrl
          ? `<div class="img-wrap"><img src="${escapeHtml(s.imageUrl)}" alt="" crossorigin="anonymous" /></div>`
          : `<div class="img-placeholder">이미지</div>`;
        return `<section class="block hero">
          ${img}
          <h1>${escapeHtml(s.headline)}</h1>
          <p class="lead">${escapeHtml(s.subcopy)}</p>
        </section>`;
      }
      if (s.kind === "feature") {
        const img = s.imageUrl
          ? `<div class="img-wrap"><img src="${escapeHtml(s.imageUrl)}" alt="" crossorigin="anonymous" /></div>`
          : `<div class="img-placeholder subtle">이미지</div>`;
        return `<section class="block feature">
          <h2>${escapeHtml(s.title)}</h2>
          <p>${escapeHtml(s.body)}</p>
          ${img}
        </section>`;
      }
      if (s.kind === "scenario") {
        return `<section class="block scenario">
          <h2>${escapeHtml(s.title)}</h2>
          <p>${escapeHtml(s.body)}</p>
        </section>`;
      }
      return `<section class="block cta">
          <h2>${escapeHtml(s.title)}</h2>
          <p>${escapeHtml(s.body)}</p>
          <div class="cta-pill">구매하기</div>
        </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      background: ${t.bg};
      color: ${t.fg};
      width: ${widthPx}px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { padding: 0 0 48px; }
    .brand {
      padding: 28px 36px 8px;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${t.muted};
    }
    .block {
      padding: 36px 40px;
      border-bottom: 1px solid rgba(127,127,127,0.15);
    }
    .hero h1 {
      font-size: 32px;
      line-height: 1.2;
      font-weight: 700;
      margin-top: 20px;
      letter-spacing: -0.02em;
    }
    .hero .lead {
      margin-top: 16px;
      font-size: 17px;
      line-height: 1.65;
      color: ${t.muted};
    }
    .feature h2, .scenario h2, .cta h2 {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 12px;
      color: ${t.accent};
    }
    .feature p, .scenario p, .cta p {
      font-size: 16px;
      line-height: 1.7;
      color: ${t.muted};
    }
    .img-wrap {
      margin-top: 24px;
      border-radius: 16px;
      overflow: hidden;
      background: ${t.card};
    }
    .img-wrap img {
      display: block;
      width: 100%;
      height: auto;
    }
    .img-placeholder {
      margin-top: 24px;
      height: 280px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${t.card};
      color: ${t.muted};
      font-size: 14px;
    }
    .img-placeholder.subtle { height: 320px; }
    .cta { text-align: center; padding-bottom: 56px; border-bottom: none; }
    .cta-pill {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 36px;
      border-radius: 999px;
      background: ${t.accent};
      color: ${payload.options.template === "minimal" ? "#fff" : "#0b0f14"};
      font-weight: 600;
      font-size: 15px;
    }
    .feature p { margin-bottom: 8px; color: ${t.fg}; opacity: 0.92; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">DetailForge</div>
    ${sectionsHtml}
  </div>
</body>
</html>`;
}
