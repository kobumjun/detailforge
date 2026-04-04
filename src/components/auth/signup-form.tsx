"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      router.push("/create");
      router.refresh();
      return;
    }
    setDone(true);
    setMessage(
      "가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 마무리해 주세요.",
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">회원가입</CardTitle>
        <CardDescription className="text-[13px] leading-relaxed">
          가입 시 3크레딧을 드립니다. 바로 상세페이지를 만들어 보세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message && (
            <p
              className={`text-sm ${done ? "text-muted-foreground" : "text-destructive"}`}
              role="status"
            >
              {message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || done}>
            {loading ? "처리 중…" : done ? "완료" : "가입하기"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
