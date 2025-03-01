import { Background } from "@/components/ui/background";
import { Metadata } from "next";
import { FeaturedTestimonials } from "@/components/landing/featured-testimonials";
import { cn } from "@/lib/utils";
import { HorizontalGradient } from "@/components/ui/horizontal-gradient";
import { ContactForm } from "@/components/landing/contact";
import { Logo } from "@/components/ui/Logo";
import { NavBar } from "@/components/navbar";
export const metadata: Metadata = {
  title: "Contact - Heard",
  description:
    "Heard transcribes and organizes all of your conversations.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function ContactPage() {
  return (
    <>
      <NavBar />
      <div className="relative overflow-hidden py-20 md:py-0 px-4 md:px-20 bg-gray-50 dark:bg-black">
        <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden">
        <Background />
        <div className="mt-20 w-full max-w-2xl px-8">
          <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
