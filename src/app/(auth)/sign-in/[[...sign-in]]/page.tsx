import { SignIn } from "@clerk/nextjs";

const appearance = {
  elements: {
    card: "w-full shadow-none",
    headerTitle: "text-[#18231e]",
    headerSubtitle: "text-[#68776d]",
    socialButtonsBlockButton: "border-[#d8ded8] hover:bg-[#f2f6ed]",
    formButtonPrimary: "bg-[#183d2a] hover:bg-[#275d42]",
    footerActionLink: "text-[#287047] hover:text-[#183d2a]",
  },
};

export default function SignInPage() {
  return <SignIn appearance={appearance} path="/sign-in" routing="path" signUpUrl="/sign-up" />;
}
