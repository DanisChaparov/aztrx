import Link from "next/link";
import { GithubSignInButton } from "@/components/GithubSignInButton";
import { Logo } from "@/components/Logo";
import { SiteBackground } from "@/components/SiteBackground";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string }>;
}) {
  const { desktop } = await searchParams;
  const isDesktop = desktop === "1";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <SiteBackground />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0e0f14]/90 px-8 py-10 text-center backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-inter text-lg font-bold tracking-tight text-white">Upstream</span>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-inter text-2xl font-extrabold tracking-tight text-white">Sign in</h1>
          <p className="font-inter text-sm text-[#A1A1AA]">
            {isDesktop
              ? "Signing in here connects your Upstream desktop widget."
              : "We use GitHub to check that your commits landed during a focus session. Signing in grants read access to your profile only — no repository access, and nothing is ever written to your account."}
          </p>
        </div>
        <GithubSignInButton desktop={isDesktop} />
      </div>
    </main>
  );
}
