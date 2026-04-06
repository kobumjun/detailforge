/**
 * @deprecated LemonSqueezy·mock 결제용 타입. 신규는 credit-packages.ts 사용.
 */
export type CreditPackId = "pack_10" | "pack_30" | "pack_100";

export interface CheckoutRequest {
  packId: CreditPackId;
  userId: string;
  email?: string | null;
}

export interface CheckoutResult {
  ok: boolean;
  provider: string;
  checkoutUrl?: string;
  orderId?: string;
  message?: string;
}

export interface BillingProvider {
  readonly id: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
}

/** @deprecated 레거시 팩 ID. 신규는 credit-packages.ts 사용. */
export const CREDIT_PACKS: Record<
  CreditPackId,
  { label: string; credits: number; description: string }
> = {
  pack_10: { label: "라이트", credits: 10, description: "먼저 써보기 좋은 분량" },
  pack_30: { label: "스탠다드", credits: 30, description: "팀·스튜디오용" },
  pack_100: { label: "프로", credits: 100, description: "대량 제작·에이전시" },
};
