import Link from "next/link";

const linkClass =
  "text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">DetailForge</p>
            <p>Contact: Hyunjun</p>
            <p>
              <a
                href="mailto:cacser47@gmail.com"
                className={linkClass}
              >
                cacser47@gmail.com
              </a>
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground"
            aria-label="Legal"
          >
            <Link href="/refund-policy" className={linkClass}>
              Refund Policy
            </Link>
            <span className="text-border select-none" aria-hidden>
              |
            </span>
            <Link href="/terms" className={linkClass}>
              Terms of Service
            </Link>
            <span className="text-border select-none" aria-hidden>
              |
            </span>
            <Link href="/privacy-policy" className={linkClass}>
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
