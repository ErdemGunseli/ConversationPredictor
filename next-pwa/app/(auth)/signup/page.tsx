import { SignupForm } from "@/components/auth/signup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Heard",
  description:
    "Heard transcribes and organizes all of your conversations.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
