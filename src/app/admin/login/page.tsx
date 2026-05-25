import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f5f5f5] font-sans">
      <div className="flex min-h-full min-h-[100dvh] flex-col lg:flex-row lg:items-stretch">
        {/* Illustration panel (desktop left / mobile top) */}
        <div className="relative flex h-[50dvh] w-full shrink-0 items-center justify-center overflow-hidden bg-white lg:h-auto lg:w-1/2 xl:w-[55%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login/illustration.png"
            alt="Ilustración El Café de Acá"
            className="relative z-0 h-full w-full select-none object-cover object-top lg:h-auto lg:max-h-[80%] lg:w-[75%] lg:max-w-[520px] lg:object-contain lg:object-center"
          />
          {/* fade into form bg */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#f5f5f5] to-transparent sm:h-20 lg:h-48" />
          <p className="absolute bottom-8 left-10 z-20 hidden select-none text-[13px] text-black/30 lg:block">
            tracking de pedidos V1 · Onnix 2026
          </p>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-1 flex-col bg-[#f5f5f5] lg:h-auto lg:w-1/2 xl:w-[45%]">
          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-8 pt-6 sm:px-6 lg:py-0">
            <div className="flex w-full max-w-[420px] flex-col gap-6 sm:gap-7 lg:max-w-[380px] lg:gap-8">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/login/logo.png"
                  alt="El Café de Acá"
                  className="h-11 select-none object-contain sm:h-14 lg:h-16"
                />
              </div>

              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </div>
          </div>

          <p className="select-none pb-5 pt-2 text-center text-[11px] text-black/30 sm:pb-6">
            tracking de pedidos V1 · Onnix 2026
          </p>
        </div>
      </div>
    </div>
  );
}
