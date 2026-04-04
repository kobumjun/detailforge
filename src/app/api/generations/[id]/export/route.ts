import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { GenerationPayload } from "@/lib/generation/types";
import { renderDetailPageToPng } from "@/lib/generation/png-export";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    .select("id, user_id, output_json, output_url")
    .eq("id", id)
    .single();

  if (error || !gen || gen.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = gen.output_json as GenerationPayload | null;
  if (!payload?.sections?.length) {
    return NextResponse.json({ error: "No payload" }, { status: 400 });
  }

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

  const storedPath =
    typeof gen.output_url === "string" && gen.output_url.length > 0
      ? gen.output_url
      : null;

  if (storedPath && !storedPath.startsWith("http")) {
    try {
      const signed = await signPath(storedPath);
      return NextResponse.redirect(signed);
    } catch {
      /* re-export if missing */
    }
  }

  let png: Buffer;
  try {
    png = await renderDetailPageToPng(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "render failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const path = `${user.id}/${gen.id}.png`;
  const { error: upErr } = await admin.storage.from("exports").upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await supabase.from("generations").update({ output_url: path }).eq("id", id);

  try {
    const signed = await signPath(path);
    return NextResponse.redirect(signed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sign failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
