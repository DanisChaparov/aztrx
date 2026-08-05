export function VideoBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <video autoPlay loop muted playsInline preload="auto"
        className="w-full h-full object-cover pointer-events-none opacity-50"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
    </div>
  );
}
