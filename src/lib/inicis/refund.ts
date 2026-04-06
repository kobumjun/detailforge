import {
  getIniApiBaseUrl,
  requireInicisApiKey,
  requireInicisMid,
} from "@/lib/inicis/config";
import { inicisRefundHashV1 } from "@/lib/inicis/crypto";

/** KST 기준 YYYYMMDDhhmmss (INIAPI 전문용) */
export function inicisApiTimestampKst(): string {
  const t = Date.now() + 9 * 60 * 60 * 1000;
  const d = new Date(t);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

/**
 * INIAPI v1 전체환불(카드) — https://manual.inicis.com/inipaypro/cancel.html
 * paymethod: 신용카드 일반적으로 Card
 */
export async function inicisCardFullRefund(args: {
  tid: string;
  clientIp: string;
  msg?: string;
}): Promise<
  | { ok: true; raw: Record<string, unknown> }
  | { ok: false; message: string; raw?: Record<string, unknown> }
> {
  const mid = requireInicisMid();
  const apiKey = requireInicisApiKey();
  const base = getIniApiBaseUrl();
  const url = `${base}/api/v1/refund`;

  const type = "Refund";
  const paymethod = "Card";
  const timestamp = inicisApiTimestampKst();
  const clientIp = args.clientIp.trim() || "127.0.0.1";
  const msg = (args.msg ?? "고객 요청 전액 취소").slice(0, 100);

  const hashData = inicisRefundHashV1({
    apiKey,
    type,
    paymethod,
    timestamp,
    clientIp,
    mid,
    tid: args.tid,
  });

  const body = new URLSearchParams({
    type,
    paymethod,
    timestamp,
    clientIp,
    mid,
    tid: args.tid,
    msg,
    hashData,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body,
    });
  } catch (e) {
    console.error("[inicis] refund fetch", e);
    return { ok: false, message: "취소 API 연결에 실패했습니다." };
  }

  const text = await res.text();
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error("[inicis] refund non-json", text.slice(0, 500));
    return { ok: false, message: "취소 응답을 해석할 수 없습니다." };
  }

  const code = String(raw.resultCode ?? raw.ResultCode ?? "");
  if (code === "00") {
    return { ok: true, raw };
  }

  return {
    ok: false,
    message: String(raw.resultMsg ?? raw.ResultMsg ?? "취소에 실패했습니다."),
    raw,
  };
}
