import { pickCategoryStockUrl } from "@/lib/generation/category-stock";
import type { GenerationPayloadV1, TemplateId } from "./types";

const templateStyles: Record<
  TemplateId,
  { bg: string; fg: string; muted: string; accent: string; card: string }
> = {
  aurora: {
    bg: "linear-gradient(180deg, #080c11 0%, #0f141c 45%, #0a0e14 100%)",
    fg: "#f1f5f9",
    muted: "rgba(241,245,249,0.68)",
    accent: "#7dd3fc",
    card: "rgba(255,255,255,0.055)",
  },
  minimal: {
    bg: "#ffffff",
    fg: "#0f172a",
    muted: "#64748b",
    accent: "#0f172a",
    card: "#f8fafc",
  },
  editorial: {
    bg: "#faf8f5",
    fg: "#1c1917",
    muted: "#57534e",
    accent: "#c2410c",
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

function legacyDetailImg(url: string, seed: string): string {
  const t = url.trim();
  const safe = escapeHtml(t);
  const fallback = escapeHtml(pickCategoryStockUrl("general", `legacy-fb|${seed}|${t}`));
  return `<img src="${safe}" alt="" loading="lazy" decoding="async" data-df-fallback="${fallback}" onerror="this.onerror=null;if(this.dataset.dfFallback)this.src=this.dataset.dfFallback" />`;
}

export function renderLegacyDetailDocument(
  payload: GenerationPayloadV1,
  widthPx = 800,
): string {
  const t = templateStyles[payload.options.template];
  const sectionsHtml = payload.sections
    .map((s) => {
      if (s.kind === "hero") {
        const img = s.imageUrl?.trim()
          ? `<div class="img-wrap hero-img">${legacyDetailImg(s.imageUrl, "hero")}</div>`
          : `<div class="img-placeholder hero-ph">상품 이미지</div>`;
        return `<section class="block hero">
          <p class="eyebrow">상품 상세</p>
          <h1>${escapeHtml(s.headline)}</h1>
          <p class="lead">${escapeHtml(s.subcopy)}</p>
          ${img}
        </section>`;
      }
      if (s.kind === "feature") {
        const img = s.imageUrl?.trim()
          ? `<div class="img-wrap">${legacyDetailImg(s.imageUrl, "feature")}</div>`
          : `<div class="img-placeholder">이미지 영역</div>`;
        return `<section class="block feature">
          <h2>${escapeHtml(s.title)}</h2>
          <p class="body">${escapeHtml(s.body)}</p>
          ${img}
        </section>`;
      }
      if (s.kind === "scenario") {
        return `<section class="block scenario">
          <p class="eyebrow scenario-eb">활용 가이드</p>
          <h2>${escapeHtml(s.title)}</h2>
          <p class="body">${escapeHtml(s.body)}</p>
        </section>`;
      }
      return `<section class="block cta">
          <h2>${escapeHtml(s.title)}</h2>
          <p class="body cta-sub">${escapeHtml(s.body)}</p>
          <a class="cta-btn" href="#">바로 구매하기</a>
        </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      background: ${t.bg};
      color: ${t.fg};
      width: ${widthPx}px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
      font-feature-settings: "ss01" on;
    }
    .wrap { padding: 0 0 56px; }
    .brand {
      padding: 32px 40px 12px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: ${t.muted};
    }
    .block {
      padding: 44px 40px;
      border-bottom: 1px solid rgba(127,127,127,0.12);
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${t.muted};
      margin-bottom: 14px;
    }
    .scenario-eb { margin-bottom: 10px; }
    .hero h1 {
      font-size: clamp(28px, 7vw, 34px);
      line-height: 1.22;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 0;
    }
    .hero .lead {
      margin-top: 18px;
      font-size: 16px;
      line-height: 1.75;
      font-weight: 500;
      color: ${t.muted};
      max-width: 36em;
    }
    .hero-img, .hero-ph { margin-top: 28px; }
    .feature h2, .scenario h2, .cta h2 {
      font-size: 20px;
      line-height: 1.35;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
      color: ${t.accent};
    }
    .feature .body, .scenario .body {
      font-size: 15px;
      line-height: 1.8;
      font-weight: 400;
      color: ${t.muted};
      max-width: 38em;
    }
    .feature .body { color: ${t.fg}; opacity: 0.9; }
    .img-wrap {
      margin-top: 26px;
      border-radius: 14px;
      overflow: hidden;
      background: ${t.card};
    }
    .img-wrap img {
      display: block;
      width: 100%;
      height: auto;
    }
    .img-placeholder {
      margin-top: 26px;
      min-height: 300px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${t.card};
      color: ${t.muted};
      font-size: 13px;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    .hero-ph { min-height: 340px; }
    .cta {
      text-align: center;
      padding: 52px 40px 60px;
      border-bottom: none;
    }
    .cta-sub { margin: 0 auto; max-width: 34em; }
    .cta-btn {
      display: inline-block;
      margin-top: 28px;
      padding: 16px 40px;
      border-radius: 999px;
      background: ${t.accent};
      color: ${payload.options.template === "minimal" ? "#ffffff" : "#0b0f14"};
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.02em;
      text-decoration: none;
    }
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
