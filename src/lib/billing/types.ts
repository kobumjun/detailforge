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

export const CREDIT_PACKS: Record<
  CreditPackId,
  { label: string; credits: number; description: string }
> = {
  pack_10: { label: "Starter", credits: 10, description: "가볍게 시작하기" },
  pack_30: { label: "Growth", credits: 30, description: "팀 단위 제작" },
  pack_100: { label: "Scale", credits: 100, description: "대량·에이전시" },
};
