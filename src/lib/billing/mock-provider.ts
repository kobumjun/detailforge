import { randomUUID } from "crypto";
import type { BillingProvider, CheckoutRequest, CheckoutResult } from "./types";

export class MockBillingProvider implements BillingProvider {
  readonly id = "mock";

  async createCheckout(_req: CheckoutRequest): Promise<CheckoutResult> {
    void _req;
    return {
      ok: true,
      provider: this.id,
      orderId: randomUUID(),
      message:
        "결제 연동 전입니다. LemonSqueezy 또는 PG 키를 설정하면 실제 결제로 전환됩니다.",
    };
  }
}
