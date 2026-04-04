import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.985_0.002_264)]">
      <AppHeader credits={profile?.credits ?? 0} email={user.email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
