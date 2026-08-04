import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AssistantPanel } from "@/components/AssistantPanel";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SiteBackground } from "@/components/SiteBackground";
import { ExtensionBridge } from "@/components/ExtensionBridge";
import { Nav } from "@/components/Nav";
import { LayoutV2 } from "@/components/LayoutV2";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Theme v2: set cookie "upstream-theme=v2" or visit ?theme=v2
  const cookieStore = await cookies();
  const themeV2 = cookieStore.get("upstream-theme")?.value === "v2";

  if (themeV2) {
    return <LayoutV2>{children}</LayoutV2>;
  }

  // Original design — preserved exactly as before
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0">
        <SiteBackground videoOpacity={0.3} />
      </div>
      <ExtensionBridge />
      <div className="relative">
        <Nav />
        <div className="mx-auto max-w-4xl px-6 pb-16">{children}</div>
      </div>
      <AssistantPanel />
    </div>
  );
}
