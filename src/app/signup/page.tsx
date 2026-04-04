import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a0f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,200,255,0.18),transparent)]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          DetailForge
        </Link>
        <Link
          href="/login"
          className="text-sm text-white/70 transition hover:text-white"
        >
          로그인
        </Link>
      </header>
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-10">
        <div className="w-full text-[#0a0a0a]">
          <SignupForm />
        </div>
      </main>
    </div>
  );
}
