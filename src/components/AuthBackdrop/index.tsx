import React from 'react'

/** Night-city illustration with smart cameras behind the login pages (public/img/login-city.svg). The form is light text on the dark picture. */
export function AuthBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      className="relative flex min-h-[calc(100vh-56px)] items-start justify-center bg-[#17406a] bg-cover bg-bottom bg-no-repeat text-white [&_input]:border-white/30 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/50"
      style={{ backgroundImage: 'url(/img/login-city.svg)' }}
    >
      <div className="absolute inset-0 bg-[#0b2540]/55" aria-hidden />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 55% at 50% 40%, rgba(8,24,44,.75), transparent 75%)' }} aria-hidden />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
