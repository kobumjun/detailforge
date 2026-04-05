import type { Metadata } from "next";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/app/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — DetailForge",
  description: "How DetailForge collects and uses personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <LegalSection title="Introduction">
        <p>
          This Privacy Policy describes how DetailForge (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) handles information when you use
          our website and services.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>
          We may collect <strong className="font-medium text-foreground">basic account information</strong> you provide when
          you register or sign in, such as email address and profile data
          associated with your authentication provider. We may also collect
          information you submit as part of using the product (for example,
          text or files you upload to generate outputs).
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We use information to operate the Service, authenticate users,
          process credits and transactions, respond to support requests, and{" "}
          <strong className="font-medium text-foreground">improve reliability and quality</strong>{" "}
          (for example, usage or diagnostic data in aggregated or de-identified
          form where applicable).
        </p>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          <strong className="font-medium text-foreground">Payment details</strong> are processed by{" "}
          <strong className="font-medium text-foreground">third-party payment providers</strong>.
          We do not store full payment card numbers on our own systems. Those
          providers handle card data according to their own terms and privacy
          policies.
        </p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We do not sell your personal information. We may share information
          with service providers who help us run the Service (such as hosting,
          authentication, or analytics) under appropriate safeguards, and when
          required by law.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We take reasonable measures to protect information, but no method of
          transmission or storage is completely secure.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          Depending on your location, you may have rights to access, correct,
          or delete certain personal data. Contact us using the email below for
          privacy-related requests.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Privacy questions:{" "}
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
