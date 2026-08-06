import { redirect } from "next/navigation";
import { AssistantPanel } from "@/components/AssistantPanel";
import { VideoBackground } from "@/components/VideoBackground";
import { SiteBackground } from "@/components/SiteBackground";
import { DesktopBridge } from "@/components/DesktopBridge";
import { ExtensionBridge } from "@/components/ExtensionBridge";
import { Nav } from "@/components/Nav";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0">
        <VideoBackground />
      </div>
      <DesktopBridge />
      <ExtensionBridge />
      <div className="relative">
        <Nav />
        <div className="mx-auto max-w-4xl px-6 pb-16">{children}</div>
      </div>
      <AssistantPanel />
    </div>
  );
}
