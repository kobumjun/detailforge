import { paymentProvider } from "@/lib/env";
import type { BillingProvider } from "./types";
import { LemonSqueezyBillingProvider } from "./lemonsqueezy-provider";
import { MockBillingProvider } from "./mock-provider";

export type * from "./types";
export { CREDIT_PACKS } from "./types";

export function getBillingProvider(): BillingProvider {
  if (paymentProvider() === "lemonsqueezy") {
    return new LemonSqueezyBillingProvider();
  }
  return new MockBillingProvider();
}
