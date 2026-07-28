import Link from "next/link";
import { GithubSignInButton } from "@/components/GithubSignInButton";
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
      <div className="liquid-glass relative z-10 flex w-full max-w-sm flex-col items-center gap-6 px-8 py-10 text-center">
        <Link href="/" className="font-jakarta text-lg font-extrabold tracking-tight text-white">
          Upstream
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-instrument-serif text-3xl text-white">Sign in</h1>
          <p className="font-inter text-sm text-white/60">
            {isDesktop
              ? "Signing in here connects your Upstream desktop widget."
              : "We use GitHub to verify your commits landed during a focus session and to read your dependencies."}
          </p>
        </div>
        <GithubSignInButton desktop={isDesktop} />
      </div>
    </main>
  );
}
