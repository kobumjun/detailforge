import type { Metadata } from "next";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/app/legal-page-shell";

export const metadata: Metadata = {
  title: "Refund Policy — DetailForge",
  description:
    "Refund policy for DetailForge credits and digital services.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund Policy">
      <LegalSection title="Overview">
        <p>
          This Refund Policy explains how refunds are handled for DetailForge
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), including
          credits and digital services delivered through our platform.
        </p>
      </LegalSection>

      <LegalSection title="Credits and used services">
        <p>
          Credits and digital services (such as generated outputs) are
          generally <strong className="font-medium text-foreground">non-refundable once used</strong> or consumed. When you
          initiate a generation or download that deducts credits, that use is
          considered delivery of the service for the purpose of this policy.
        </p>
      </LegalSection>

      <LegalSection title="Technical issues">
        <p>
          If a <strong className="font-medium text-foreground">technical issue on our side</strong> prevents you from receiving
          the service you paid for with credits (for example, a confirmed
          system failure after a successful charge), please contact us. We will
          review the situation and may offer a credit adjustment or other
          reasonable resolution where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="How we review requests">
        <p>
          Refund or compensation requests are considered <strong className="font-medium text-foreground">on a case-by-case basis</strong>.
          We may ask for details such as the time of the issue, your account
          email, and any error messages. Submitting a request does not guarantee
          a refund.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For refund-related questions, contact:{" "}
          <a
            href="mailto:cacser47@gmail.com"
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            cacser47@gmail.com
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
