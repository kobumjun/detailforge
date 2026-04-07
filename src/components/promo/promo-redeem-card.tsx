"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PromoRedeemCard({
  isLoggedIn,
  alreadyUsed,
}: {
  isLoggedIn: boolean;
  alreadyUsed: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onApply() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setIsError(true);
        setMessage(data.message || "코드 적용에 실패했습니다.");
        return;
      }
      setCode("");
      setMessage(data.message || "10크레딧이 지급되었습니다.");
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("코드 적용 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">프로모션 코드</CardTitle>
        <CardDescription>
          제휴 링크 방문자 전용 코드입니다. 계정당 1회, 코드당 1회 사용 가능합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isLoggedIn ? (
          <p className="text-sm text-muted-foreground">
            로그인 후 프로모션 코드를 입력할 수 있습니다.{" "}
            <Link href="/login?next=/promo" className="underline underline-offset-4">
              로그인하기
            </Link>
          </p>
        ) : alreadyUsed ? (
          <p className="text-sm text-muted-foreground">
            이미 프로모션 코드 사용이 완료된 계정입니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: DFP-XXXX-XXXX"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={13}
            />
            <Button
              type="button"
              onClick={() => void onApply()}
              disabled={loading || code.trim().length < 8}
            >
              {loading ? "적용 중…" : "코드 적용"}
            </Button>
          </div>
        )}
        {message ? (
          <p className={`text-sm ${isError ? "text-destructive" : "text-emerald-600"}`}>
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
