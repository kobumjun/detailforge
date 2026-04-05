import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GenerationPayload } from "@/lib/generation/types";
import { isPayloadV2 } from "@/lib/generation/types";
import { renderDetailPageToPng } from "@/lib/generation/png-export";

export const runtime = "nodejs";
export const maxDuration = 120;

const USER_EXPORT_FAIL =
  "이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function hasRenderablePayload(p: GenerationPayload | null | undefined): boolean {
  if (!p) return false;
  if (isPayloadV2(p)) return p.blocks.length > 0;
  return Array.isArray(p.sections) && p.sections.length > 0;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 400 },
    );
  }

  const payload = (body as { payload?: GenerationPayload }).payload;
  if (!hasRenderablePayload(payload)) {
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 400 },
    );
  }

  const safePayload = payload as GenerationPayload;

  try {
    const png = await renderDetailPageToPng(safePayload);
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="detail.png"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export-png] render", e);
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 200 },
    );
  }
}
