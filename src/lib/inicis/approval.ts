import { inicisApprovalHashes } from "@/lib/inicis/crypto";
import { requireInicisMid, requireInicisSignKey } from "@/lib/inicis/config";

function assertSafeInicisHttpsUrl(url: string): void {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("invalid_auth_url");
  }
  if (u.protocol !== "https:") throw new Error("invalid_auth_url");
  const h = u.hostname.toLowerCase();
  if (!h.endsWith("inicis.com")) throw new Error("invalid_auth_url");
}

/**
 * STEP3 승인요청 — 이니시스가 내려준 authUrl 로 POST 후 JSON 파싱.
 */
export async function requestInicisApproval(args: {
  authUrl: string;
  authToken: string;
  price: number;
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const { authUrl, authToken, price } = args;
  assertSafeInicisHttpsUrl(authUrl);

  const mid = requireInicisMid();
  const signKey = requireInicisSignKey();
  const timestamp = Date.now().toString();
  const { signature, verification } = inicisApprovalHashes({
    authToken,
    timestamp,
    signKey,
  });

  const body = new URLSearchParams({
    mid,
    authToken,
    timestamp,
    signature,
    verification,
    charset: "UTF-8",
    format: "JSON",
    price: String(price),
  });

  let res: Response;
  try {
    res = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        Accept: "application/json, text/plain, */*",
      },
      body,
    });
  } catch (e) {
    console.error("[inicis] approval fetch", e);
    return { ok: false, message: "승인 요청 연결에 실패했습니다." };
  }

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error("[inicis] approval non-json", text.slice(0, 500));
    return { ok: false, message: "승인 응답을 해석할 수 없습니다." };
  }

  return { ok: true, data };
}

export function readInicisResultCode(data: Record<string, unknown>): string {
  const v =
    data.resultCode ??
    data.ResultCode ??
    data.resultcode ??
    data.RESULTCODE;
  return v != null ? String(v) : "";
}

export function readInicisString(
  data: Record<string, unknown>,
  keys: string[],
): string {
  for (const k of keys) {
    const v = data[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
}

export function readInicisInt(
  data: Record<string, unknown>,
  keys: string[],
): number {
  const s = readInicisString(data, keys).replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
