import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logImageSrcContext } from "@/lib/generation/image-url-utils";
import type { GenerationPayload } from "@/lib/generation/types";
import { isPayloadV2 } from "@/lib/generation/types";
import { renderDetailDocument } from "@/lib/generation/render-html";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: gen, error } = await supabase
    .from("generations")
    .select("user_id, output_json")
    .eq("id", id)
    .single();

  if (error || !gen || gen.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = gen.output_json as GenerationPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "No payload" }, { status: 400 });
  }

  if (process.env.DEBUG_PREVIEW_IMAGES === "1") {
    if (isPayloadV2(payload)) {
      payload.blocks.forEach((b, i) => {
        if (b.type === "hero_shelf" || b.type === "fullbleed_visual") {
          logImageSrcContext(`preview:v2:${i}:${b.type}`, b.imageUrl);
        }
      });
    } else {
      payload.sections.forEach((s, i) => {
        if (s.kind === "hero" || s.kind === "feature") {
          logImageSrcContext(`preview:v1:${i}:${s.kind}`, s.imageUrl);
        }
      });
    }
  }

  const html = renderDetailDocument(payload);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
