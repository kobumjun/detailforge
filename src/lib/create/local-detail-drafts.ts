import type { GenerationPayload } from "@/lib/generation/types";
import { isPayloadV2 } from "@/lib/generation/types";

const STORAGE_KEY = "detailforge.localDetailDrafts.v1";
const MAX_DRAFTS = 2;
const SUMMARY_LEN = 72;

export type LocalDetailDraft = {
  id: string;
  savedAt: number;
  summary: string;
  payload: GenerationPayload;
};

function summaryFromPayload(p: GenerationPayload): string {
  if (isPayloadV2(p)) {
    const hero = p.blocks.find(
      (b): b is Extract<typeof b, { type: "hero_shelf" }> =>
        b.type === "hero_shelf",
    );
    const line =
      hero?.headline?.trim() ||
      p.options.productDescription?.trim() ||
      "무제";
    return line.slice(0, SUMMARY_LEN);
  }
  const hero = p.sections.find((s) => s.kind === "hero");
  const line =
    hero?.headline?.trim() ||
    p.options.productDescription?.trim() ||
    "무제";
  return line.slice(0, SUMMARY_LEN);
}

function readRaw(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeRaw(rows: LocalDetailDraft[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* quota or private mode */
  }
}

export function listLocalDetailDrafts(): LocalDetailDraft[] {
  const raw = readRaw();
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is LocalDetailDraft =>
        r &&
        typeof r === "object" &&
        typeof (r as LocalDetailDraft).id === "string" &&
        typeof (r as LocalDetailDraft).savedAt === "number" &&
        typeof (r as LocalDetailDraft).summary === "string" &&
        (r as LocalDetailDraft).payload != null,
    )
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_DRAFTS);
}

/** Keeps newest first, max 2. */
export function saveLocalDetailDraft(payload: GenerationPayload): boolean {
  if (typeof window === "undefined") return false;
  try {
    const clone = structuredClone(payload) as GenerationPayload;
    const row: LocalDetailDraft = {
      id: crypto.randomUUID(),
      savedAt: Date.now(),
      summary: summaryFromPayload(clone),
      payload: clone,
    };
    const prev = listLocalDetailDrafts();
    const next = [row, ...prev].slice(0, MAX_DRAFTS);
    writeRaw(next);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalDetailDraft(id: string) {
  const prev = listLocalDetailDrafts();
  writeRaw(prev.filter((d) => d.id !== id));
}
