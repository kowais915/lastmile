import { SignOutButton } from "@clerk/nextjs";

export function SignOutControl({ dark = false }: { dark?: boolean }) {
  return (
    <SignOutButton>
      <button
        type="button"
        className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${dark
          ? "border-white/25 text-white hover:bg-white/10"
          : "border-[#cfd8d0] bg-white text-[#285d3c] hover:bg-[#f2f6ed]"
        }`}
      >
        Sign out
      </button>
    </SignOutButton>
  );
}
