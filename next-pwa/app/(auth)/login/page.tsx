import { LoginForm } from "@/components/auth/login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Heard",
  description:
    "Heard transcribes and organizes all of your conversations.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
