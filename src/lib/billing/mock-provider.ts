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
        "결제 수단 연결 전입니다. 주문 요청은 접수되었으며, 결제가 열리면 크레딧이 자동 반영됩니다.",
    };
  }
}
