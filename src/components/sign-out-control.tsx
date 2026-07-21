"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

export function SignOutControl({ dark = false }: { dark?: boolean }) {
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-busy={isSigningOut}
      className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-70 ${dark
        ? "border-white/25 text-white hover:bg-white/10"
        : "border-[#cfd8d0] bg-white text-[#285d3c] hover:bg-[#f2f6ed]"
      }`}
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
