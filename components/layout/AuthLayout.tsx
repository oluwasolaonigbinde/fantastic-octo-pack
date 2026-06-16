export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div
        data-auth-frame
        className="flex min-h-screen w-full bg-[#f5f5f5]"
      >
        <div
          data-auth-hero
          className="relative hidden min-h-screen flex-1 overflow-hidden bg-[#03265c] md:block"
        >
          <div className="absolute inset-0 bg-[url('/authbg.webp')] bg-cover bg-center" />
          <div className="relative flex h-full flex-col justify-start px-12 pt-[138px] text-white lg:px-16">
            <div className="max-w-[662px]">
              <h1 className="font-urbanist text-[56px] font-black leading-[1.12]">
                Africa&apos;s Marketplace for Medical Equipment
              </h1>
              <p className="mt-4 max-w-[632px] font-montserrat text-xl leading-8 text-white/90">
                Eligible OEMs, Verified Distributors and Service Engineers all at
                your fingertips
              </p>
            </div>
          </div>
        </div>
        <div
          data-auth-panel
          className="flex w-full items-start justify-center bg-white px-6 py-8 md:w-[526px] md:shrink-0 md:px-14 md:py-12"
        >
          <div data-auth-content className="w-full font-urbanist">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
