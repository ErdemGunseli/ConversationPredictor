import { LoginForm } from "@/components/auth/login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Convers",
  description:
    "Predict the conversation",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
