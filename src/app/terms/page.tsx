import type { Metadata } from "next";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/app/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service — DetailForge",
  description: "Terms of Service for using DetailForge.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <LegalSection title="Agreement">
        <p>
          By accessing or using DetailForge (&quot;Service&quot;), you agree to
          these Terms of Service. If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You are <strong className="font-medium text-foreground">responsible for the content you submit</strong> to the
          Service, including product descriptions, images, and other materials.
          You represent that you have the rights needed to use that content and
          that it does not violate applicable law or third-party rights.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You may not use the Service for unlawful, abusive, harassing, or infringing purposes, or to generate content that violates applicable laws or the rights of others. We may refuse or remove content or suspend access where we reasonably believe these rules are violated.</p>
      </LegalSection>

      <LegalSection title="Credits">
        <p>
          Certain actions (such as generation or export) may require{" "}
          <strong className="font-medium text-foreground">credits</strong>.
          Credits are a limited license to use the Service as described at
          purchase or grant. Credits are subject to the rules shown in the
          product at the time of use and may expire or change if we update our
          offerings.
        </p>
      </LegalSection>

      <LegalSection title="Changes to the Service">
        <p>
          We may modify, suspend, or discontinue features over time. We will
          aim to communicate material changes where reasonable, but we do not
          guarantee uninterrupted or error-free operation.
        </p>
      </LegalSection>

      <LegalSection title="Suspension">
        <p>
          We may <strong className="font-medium text-foreground">suspend or terminate</strong> access for abuse, fraud,
          risk to the Service or other users, or violation of these Terms,
          subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          The Service is provided &quot;as is&quot; to the extent permitted by
          law. We disclaim warranties not expressly stated here, within the
          limits allowed by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms:{" "}
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
