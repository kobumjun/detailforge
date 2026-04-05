import Link from "next/link";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[50vh] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <Link
          href="/"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Last updated: April 5, 2026
        </p>
        <div className="mt-12 space-y-10 text-[15px] leading-[1.75] text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
