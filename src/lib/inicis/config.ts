import { appUrl } from "@/lib/env";

/** 공개 사이트 베이스 URL (이니시스 returnUrl·closeUrl·리다이렉트) */
export function getPublicSiteUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromPublic) return fromPublic;
  return appUrl();
}

export function isInicisStaging(): boolean {
  const v = process.env.NEXT_PUBLIC_INICIS_ENV?.trim().toLowerCase();
  return v === "staging" || v === "stg" || v === "test";
}

export function getStdPayScriptUrl(): string {
  if (process.env.NEXT_PUBLIC_INICIS_STDPAY_SCRIPT?.trim()) {
    return process.env.NEXT_PUBLIC_INICIS_STDPAY_SCRIPT.trim();
  }
  return isInicisStaging()
    ? "https://stgstdpay.inicis.com/stdjs/INIStdPay.js"
    : "https://stdpay.inicis.com/stdjs/INIStdPay.js";
}

export function getIniApiBaseUrl(): string {
  return isInicisStaging()
    ? "https://stginiapi.inicis.com"
    : "https://iniapi.inicis.com";
}

export function requireInicisMid(): string {
  const mid = process.env.INICIS_MID?.trim();
  if (!mid) throw new Error("Missing INICIS_MID");
  return mid;
}

export function requireInicisSignKey(): string {
  const k = process.env.INICIS_SIGN_KEY?.trim();
  if (!k) throw new Error("Missing INICIS_SIGN_KEY");
  return k;
}

export function requireInicisApiKey(): string {
  const k = process.env.INICIS_API_KEY?.trim();
  if (!k) throw new Error("Missing INICIS_API_KEY");
  return k;
}
