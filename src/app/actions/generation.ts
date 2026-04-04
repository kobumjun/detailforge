"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildGenerationPayload } from "@/lib/generation/build-sections";
import type { GenerationOptions } from "@/lib/generation/types";
import type { DetailLength, ToneOption } from "@/lib/providers/text-gen/types";
import type { TemplateId } from "@/lib/generation/types";

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function uploadUserImages(
  userId: string,
  files: File[],
): Promise<string[]> {
  const supabase = await createClient();
  const urls: string[] = [];

  for (const f of files) {
    if (!f || f.size === 0) continue;
    const path = `${userId}/${crypto.randomUUID()}-${sanitizeName(f.name || "image")}`;
    const buf = new Uint8Array(await f.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("uploads")
      .upload(path, buf, {
        contentType: f.type || "image/png",
        upsert: false,
      });
    if (upErr) {
      throw new Error("이미지를 업로드하지 못했습니다. 파일 형식과 용량을 확인해 주세요.");
    }

    const { data, error: signErr } = await supabase.storage
      .from("uploads")
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (signErr || !data?.signedUrl) {
      throw new Error("이미지 주소를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    urls.push(data.signedUrl);
  }

  return urls;
}

export type GenerateState =
  | { ok: true; generationId: string }
  | { ok: false; message: string };

export async function generateDetailAction(
  _prev: GenerateState | undefined,
  formData: FormData,
): Promise<GenerateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 필요합니다." };

  const productDescription = String(formData.get("productDescription") || "").trim();
  if (!productDescription) {
    return { ok: false, message: "상품 설명을 입력해 주세요." };
  }

  const targetCustomer = String(formData.get("targetCustomer") || "").trim() || undefined;
  const tone = (String(formData.get("tone") || "premium") as ToneOption) || "premium";
  const colorHint = String(formData.get("colorHint") || "").trim() || undefined;
  const sellingPoints = String(formData.get("sellingPoints") || "").trim() || undefined;
  const template = (String(formData.get("template") || "aurora") as TemplateId) || "aurora";
  const length = (String(formData.get("length") || "medium") as DetailLength) || "medium";
  const aiFillImages = formData.get("aiFillImages") === "on";

  const imageFiles = formData.getAll("images").filter((x): x is File => x instanceof File);

  const { data: rpcData, error: rpcErr } = await supabase.rpc("consume_credit", {
    p_amount: 1,
    p_reason: "generation",
  });

  if (rpcErr) {
    return {
      ok: false,
      message: "크레딧 처리 중 문제가 발생했습니다. 새로고침 후 다시 시도해 주세요.",
    };
  }

  const rpc = rpcData as { ok?: boolean; error?: string } | null;
  if (!rpc?.ok) {
    const err = rpc?.error;
    if (err === "insufficient_credits") {
      return { ok: false, message: "크레딧이 부족합니다. 충전 페이지에서 패키지를 선택해 주세요." };
    }
    return { ok: false, message: "크레딧 차감에 실패했습니다." };
  }

  try {
    const userImageUrls = await uploadUserImages(user.id, imageFiles);

    const options: GenerationOptions = {
      productDescription,
      targetCustomer,
      tone,
      colorHint,
      sellingPoints,
      template,
      length,
      aiFillImages,
      userImageUrls,
    };

    const payload = await buildGenerationPayload(options);

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        product_description: productDescription,
        options,
        output_json: payload,
      })
      .select("id")
      .single();

    if (insErr || !row) {
      throw new Error("결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }

    revalidatePath("/create");
    return { ok: true, generationId: row.id };
  } catch (e) {
    await supabase.rpc("refund_credit", {
      p_amount: 1,
      p_reason: "generation_failed",
    });
    const msg = e instanceof Error ? e.message : "생성 중 오류가 발생했습니다.";
    return { ok: false, message: msg };
  }
}
