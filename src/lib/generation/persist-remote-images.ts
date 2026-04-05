import { createServiceClient } from "@/lib/supabase/service";
import { pickCategoryStockUrl } from "@/lib/generation/category-stock";
import {
  logImageSrcContext,
  normalizedImageUrl,
  shouldRehostRemoteImage,
} from "@/lib/generation/image-url-utils";
import type { VisualCategoryKey } from "@/lib/generation/visual-category";
import type { CommerceBlock, GenerationPayload, GenerationPayloadV1 } from "./types";
import { isPayloadV2 } from "./types";

const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 365;

function extFromContentType(ct: string): string {
  const c = ct.toLowerCase();
  if (c.includes("webp")) return "webp";
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("png")) return "png";
  return "bin";
}

async function fetchImageBytes(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const t = url.trim();
  if (t.startsWith("data:")) {
    const m = /^data:([^;]+);base64,(.+)$/i.exec(t);
    if (!m?.[2]) throw new Error("Invalid data URL");
    return {
      buffer: Buffer.from(m[2], "base64"),
      contentType: m[1]?.trim() || "image/png",
    };
  }
  const res = await fetch(t, {
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, contentType: ct };
}

async function uploadAndSignUrl(args: {
  admin: ReturnType<typeof createServiceClient>;
  userId: string;
  generationId: string;
  slotKey: string;
  sourceUrl: string;
  urlCache: Map<string, string>;
}): Promise<string> {
  const { admin, userId, generationId, slotKey, sourceUrl, urlCache } = args;
  const cached = urlCache.get(sourceUrl);
  if (cached) return cached;

  const { buffer, contentType } = await fetchImageBytes(sourceUrl);
  const ext = extFromContentType(contentType);
  const objectPath = `${userId}/generations/${generationId}/${slotKey}.${ext}`;

  const { error: upErr } = await admin.storage.from("uploads").upload(objectPath, buffer, {
    contentType,
    upsert: true,
  });
  if (upErr) {
    throw new Error(upErr.message);
  }

  const ttlFallbacks = [
    SIGNED_URL_TTL_SEC,
    60 * 60 * 24 * 30,
    60 * 60 * 24 * 7,
  ];
  let signedUrl: string | undefined;
  let lastSignErr: string | undefined;
  for (const ttl of ttlFallbacks) {
    const { data: signed, error: signErr } = await admin.storage
      .from("uploads")
      .createSignedUrl(objectPath, ttl);
    if (!signErr && signed?.signedUrl) {
      signedUrl = signed.signedUrl;
      break;
    }
    lastSignErr = signErr?.message;
  }
  if (!signedUrl) {
    throw new Error(lastSignErr || "createSignedUrl failed");
  }

  urlCache.set(sourceUrl, signedUrl);
  logImageSrcContext(`rehosted:${slotKey}`, signedUrl);
  return signedUrl;
}

function stockFallback(category: VisualCategoryKey, seed: string): string {
  return pickCategoryStockUrl(category, seed);
}

async function stabilizeBlockImages(args: {
  blocks: CommerceBlock[];
  userId: string;
  generationId: string;
  categoryKey: VisualCategoryKey;
  admin: ReturnType<typeof createServiceClient>;
  urlCache: Map<string, string>;
}): Promise<void> {
  const { blocks, userId, generationId, categoryKey, admin, urlCache } = args;
  let fullbleedIdx = 0;

  for (const block of blocks) {
    if (block.type === "hero_shelf") {
      const u = normalizedImageUrl(block.imageUrl);
      if (!u) {
        block.imageUrl = undefined;
        continue;
      }
      logImageSrcContext("block:hero_shelf:before", u);
      if (!shouldRehostRemoteImage(u)) {
        block.imageUrl = u;
        continue;
      }
      try {
        block.imageUrl = await uploadAndSignUrl({
          admin,
          userId,
          generationId,
          slotKey: "hero",
          sourceUrl: u,
          urlCache,
        });
      } catch (e) {
        console.error("[stabilize-images] hero rehost failed", e);
        block.imageUrl = stockFallback(categoryKey, `${generationId}|hero`);
      }
      continue;
    }

    if (block.type === "fullbleed_visual") {
      const u = normalizedImageUrl(block.imageUrl);
      if (!u) {
        block.imageUrl = undefined;
        continue;
      }
      const slot = `fullbleed-${fullbleedIdx++}`;
      logImageSrcContext(`block:${slot}:before`, u);
      if (!shouldRehostRemoteImage(u)) {
        block.imageUrl = u;
        continue;
      }
      try {
        block.imageUrl = await uploadAndSignUrl({
          admin,
          userId,
          generationId,
          slotKey: slot,
          sourceUrl: u,
          urlCache,
        });
      } catch (e) {
        console.error("[stabilize-images] fullbleed rehost failed", e);
        block.imageUrl = stockFallback(categoryKey, `${generationId}|${slot}`);
      }
    }
  }
}

async function stabilizeLegacySections(args: {
  payload: GenerationPayloadV1;
  userId: string;
  generationId: string;
  admin: ReturnType<typeof createServiceClient>;
  urlCache: Map<string, string>;
}): Promise<void> {
  const { payload, userId, generationId, admin, urlCache } = args;
  let i = 0;
  for (const s of payload.sections) {
    if (s.kind !== "hero" && s.kind !== "feature") continue;
    const u = normalizedImageUrl(s.imageUrl);
    if (!u) {
      s.imageUrl = undefined;
      continue;
    }
    logImageSrcContext(`legacy:section-${i}:before`, u);
    if (!shouldRehostRemoteImage(u)) {
      s.imageUrl = u;
      continue;
    }
    try {
      s.imageUrl = await uploadAndSignUrl({
        admin,
        userId,
        generationId,
        slotKey: `legacy-${i}`,
        sourceUrl: u,
        urlCache,
      });
    } catch (e) {
      console.error("[stabilize-images] legacy rehost failed", e);
      s.imageUrl = stockFallback("general", `${generationId}|legacy-${i}`);
    }
    i += 1;
  }
}

/**
 * 만료되기 쉬운 URL(OpenAI blob, 짧은 Supabase 서명 URL 등)을
 * uploads/{userId}/generations/{id}/ 로 복사한 뒤 긴 TTL 서명 URL로 교체.
 */
export async function stabilizeGenerationPayloadImages(
  payload: GenerationPayload,
  userId: string,
  generationId: string,
): Promise<GenerationPayload> {
  let admin: ReturnType<typeof createServiceClient>;
  try {
    admin = createServiceClient();
  } catch (e) {
    console.error("[stabilize-images] no service client, skip", e);
    return payload;
  }

  const urlCache = new Map<string, string>();
  const out = structuredClone(payload) as GenerationPayload;

  try {
    if (isPayloadV2(out)) {
      await stabilizeBlockImages({
        blocks: out.blocks,
        userId,
        generationId,
        categoryKey: out.categoryKey,
        admin,
        urlCache,
      });
    } else {
      await stabilizeLegacySections({
        payload: out,
        userId,
        generationId,
        admin,
        urlCache,
      });
    }
  } catch (e) {
    console.error("[stabilize-images] fatal", e);
  }

  return out;
}
