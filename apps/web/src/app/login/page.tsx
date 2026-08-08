import Link from "next/link";
import { EmailSignInForm } from "@/components/EmailSignInForm";
import { SocialSignInButton } from "@/components/SocialSignInButton";
import { Logo } from "@/components/Logo";
import { VideoBackground } from "@/components/VideoBackground";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string }>;
}) {
  const { desktop } = await searchParams;
  const isDesktop = desktop === "1";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6" data-build="2026-08-09-d1">
      <VideoBackground />
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
              : "Welcome back. Sign in to your account to continue."}
          </p>
        </div>

        {/* Social sign-in buttons */}
        <div className="flex w-full flex-col gap-2.5">
          <SocialSignInButton provider="google" desktop={isDesktop} />
          <SocialSignInButton provider="github" desktop={isDesktop} />
          <SocialSignInButton provider="twitter" desktop={isDesktop} />
          <SocialSignInButton provider="facebook" desktop={isDesktop} />
        </div>

        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="font-inter text-[11px] text-neutral-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Email/password sign-in */}
        <EmailSignInForm />

        <p className="font-inter text-[13px] text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#60A5FA] hover:underline">
            Sign up
          </Link>
        </p>

        <p className="font-inter text-[11px] text-neutral-600">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
