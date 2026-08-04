import { SiteBackground } from "@/components/SiteBackground";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <SiteBackground />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="font-inter text-xl font-bold text-white">Sign in failed</h1>
          <p className="font-inter text-sm text-[#A1A1AA]">
            Something went wrong during sign-in. This is usually because the OAuth app
            credentials don't match between Supabase and the provider.
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-xl bg-[#6744FF] px-6 py-3 font-inter text-sm font-medium text-white transition-colors hover:bg-[#5a39f0]"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
