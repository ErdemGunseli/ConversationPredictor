import { SignupForm } from "@/components/auth/signup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Convers",
  description:
    "Predict the conversation",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
