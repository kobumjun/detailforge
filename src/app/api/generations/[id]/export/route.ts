import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { GenerationPayload } from "@/lib/generation/types";
import { isPayloadV2 } from "@/lib/generation/types";
import { renderDetailPageToPng } from "@/lib/generation/png-export";

export const runtime = "nodejs";
/** Chromium 팩 최초 다운로드 + 풀페이지 캡처까지 여유 (Vercel Pro 등에서 상향) */
export const maxDuration = 120;

const USER_EXPORT_FAIL =
  "이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function hasRenderablePayload(p: GenerationPayload | null): boolean {
  if (!p) return false;
  if (isPayloadV2(p)) return p.blocks.length > 0;
  return Array.isArray(p.sections) && p.sections.length > 0;
}

async function handleExport(
  id: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string },
): Promise<Response> {
  const admin = createServiceClient();

  async function signPath(path: string) {
    const { data, error: sErr } = await admin.storage
      .from("exports")
      .createSignedUrl(path, 60 * 30);
    if (sErr || !data?.signedUrl) {
      throw new Error(sErr?.message || "sign failed");
    }
    return data.signedUrl;
  }

  const { data: gen, error } = await supabase
    .from("generations")
    .select("id, user_id, output_json, output_url")
    .eq("id", id)
    .single();

  if (error || !gen || gen.user_id !== user.id) {
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 404 },
    );
  }

  const payload = gen.output_json as GenerationPayload | null;
  if (!hasRenderablePayload(payload)) {
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 400 },
    );
  }

  const storedPath =
    typeof gen.output_url === "string" && gen.output_url.length > 0
      ? gen.output_url
      : null;

  if (storedPath && !storedPath.startsWith("http")) {
    try {
      const signed = await signPath(storedPath);
      return NextResponse.json({ ok: true, url: signed });
    } catch {
      /* regenerate */
    }
  }

  let png: Buffer;
  try {
    png = await renderDetailPageToPng(payload!);
  } catch (e) {
    console.error("[export-png] render", e);
    return NextResponse.json({ ok: false, message: USER_EXPORT_FAIL }, { status: 200 });
  }

  const path = `${user.id}/${gen.id}.png`;
  const { error: upErr } = await admin.storage.from("exports").upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });

  if (upErr) {
    console.error("[export-png] upload", upErr);
    return NextResponse.json({ ok: false, message: USER_EXPORT_FAIL }, { status: 200 });
  }

  await supabase.from("generations").update({ output_url: path }).eq("id", id);

  try {
    const signed = await signPath(path);
    return NextResponse.json({ ok: true, url: signed });
  } catch (e) {
    console.error("[export-png] sign", e);
    return NextResponse.json({ ok: false, message: USER_EXPORT_FAIL }, { status: 200 });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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
  return handleExport(id, supabase, user);
}

/** 캐시된 파일이 있으면 JSON으로 signed URL 반환 (구 링크 호환) */
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
    return NextResponse.json(
      { ok: false, message: USER_EXPORT_FAIL },
      { status: 401 },
    );
  }
  return handleExport(id, supabase, user);
}
