import Link from "next/link";
import { Coins } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/app/sign-out-button";

export function AppHeader({
  credits,
  email,
}: {
  credits: number;
  email: string | null | undefined;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/create"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          DetailForge
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/create"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            생성
          </Link>
          <Link
            href="/billing"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            크레딧 충전
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
            <Coins className="size-3.5 text-amber-600" aria-hidden />
            <span>{credits} 크레딧</span>
          </div>
          <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground md:inline">
            {email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
