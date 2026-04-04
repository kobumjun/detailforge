import type {
  BillingProvider,
  CheckoutRequest,
  CheckoutResult,
  CreditPackId,
} from "./types";

const variantEnv: Record<CreditPackId, string | undefined> = {
  pack_10: process.env.LEMONSQUEEZY_VARIANT_ID_10,
  pack_30: process.env.LEMONSQUEEZY_VARIANT_ID_30,
  pack_100: process.env.LEMONSQUEEZY_VARIANT_ID_100,
};

/**
 * Skeleton for LemonSqueezy Checkout — implement API call when keys are set.
 * Docs: https://docs.lemonsqueezy.com/api/checkouts#create-a-checkout
 */
export class LemonSqueezyBillingProvider implements BillingProvider {
  readonly id = "lemonsqueezy";

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const variantId = variantEnv[req.packId];
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!variantId || !storeId || !apiKey) {
      return {
        ok: false,
        provider: this.id,
        message: "LemonSqueezy 환경변수가 설정되지 않았습니다.",
      };
    }

    // const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", { ... })
    return {
      ok: false,
      provider: this.id,
      message:
        "LemonSqueezy 체크아웃 API 호출은 키 발급 후 이 클래스에 연결하세요.",
    };
  }
}
