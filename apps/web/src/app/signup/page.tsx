import Link from "next/link";
import { SocialSignInButton } from "@/components/SocialSignInButton";
import { EmailSignUpForm } from "@/components/EmailSignUpForm";
import { Logo } from "@/components/Logo";
import { ParticleBackground } from "@/components/ParticleBackground";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string }>;
}) {
  const { desktop } = await searchParams;
  const isDesktop = desktop === "1";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <ParticleBackground />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0e0f14]/90 px-8 py-10 text-center backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-inter text-lg font-bold tracking-tight text-white">Upstream</span>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-inter text-2xl font-extrabold tracking-tight text-white">Sign up</h1>
          <p className="font-inter text-sm text-[#A1A1AA]">
            {isDesktop
              ? "Create your account to connect the Upstream desktop widget."
              : "Create your account to start tracking verified focus sessions, building streaks, and funding open source."}
          </p>
        </div>

        {/* Social sign-up buttons */}
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

        {/* Email/password registration */}
        <EmailSignUpForm />

        <p className="font-inter text-[13px] text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8b74ff] hover:underline">
            Sign in
          </Link>
        </p>

        <p className="font-inter text-[11px] text-neutral-600">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
