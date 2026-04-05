import type { GenerationPayload } from "./types";
import { isPayloadV2 } from "./types";
import { renderCommerceDetailDocument } from "./render-commerce-html";
import { renderLegacyDetailDocument } from "./render-legacy-detail";

export function renderDetailDocument(
  payload: GenerationPayload,
  widthPx = 800,
): string {
  if (isPayloadV2(payload)) {
    return renderCommerceDetailDocument(payload, widthPx);
  }
  return renderLegacyDetailDocument(payload, widthPx);
}
