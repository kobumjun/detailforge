/** 서버 로그용 — 토큰·전체 경로 노출 최소화 */
export function logImageSrcContext(label: string, url: string | undefined): void {
  if (url == null || url === "") {
    console.info(`[generation:image-src] ${label}`, {
      ok: false,
      reason: "missing_or_empty",
    });
    return;
  }
  const t = url.trim();
  if (!t) {
    console.info(`[generation:image-src] ${label}`, {
      ok: false,
      reason: "whitespace_only",
    });
    return;
  }
  if (t.startsWith("data:")) {
    console.info(`[generation:image-src] ${label}`, {
      ok: true,
      kind: "data_url",
      bytesHint: t.length,
    });
    return;
  }
  try {
    const u = new URL(t);
    console.info(`[generation:image-src] ${label}`, {
      ok: true,
      protocol: u.protocol,
      host: u.hostname,
      pathPrefix: u.pathname.slice(0, 64),
      signedQuery: u.search.includes("token="),
    });
  } catch {
    console.info(`[generation:image-src] ${label}`, {
      ok: false,
      reason: "invalid_url",
      preview: t.slice(0, 80),
    });
  }
}

/** http(s) 또는 data URL만 허용, 그 외·빈 값은 undefined */
export function normalizedImageUrl(
  u: string | undefined,
): string | undefined {
  if (u == null) return undefined;
  const t = u.trim();
  if (!t) return undefined;
  if (t.startsWith("data:image/")) return t;
  try {
    const parsed = new URL(t);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return t;
  } catch {
    return undefined;
  }
}

/**
 * Storage에 다시 올려 안정적인 링크로 바꿀지 여부.
 * Unsplash 등 핫링크 허용 CDN은 그대로 둠.
 */
export function shouldRehostRemoteImage(url: string): boolean {
  const t = url.trim();
  if (t.startsWith("data:")) return true;
  try {
    const u = new URL(t);
    const h = u.hostname.toLowerCase();
    if (h.endsWith(".blob.core.windows.net")) return true;
    if (h.includes("openai")) return true;
    if (h.endsWith("supabase.co")) {
      const p = u.pathname.toLowerCase();
      if (p.includes("/storage/v1/object/sign")) return true;
      if (p.includes("/render/image/sign")) return true;
      return false;
    }
    return false;
  } catch {
    return false;
  }
}
