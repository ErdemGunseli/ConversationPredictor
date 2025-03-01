import { cn } from "@/lib/utils";
import Image from "next/image";
import { useId } from "react";
import { motion } from "framer-motion";
import { HorizontalGradient } from "@/components/ui/horizontal-gradient";
import { FeaturedTestimonials } from "@/components/landing/featured-testimonials";
import { Logo } from "@/components/ui/Logo";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile gradient background (visible below md breakpoint) */}
      <div className="fixed inset-0 z-0 md:hidden">
        <BackgroundGradientAnimation 
          containerClassName="absolute inset-0 !h-full !w-full" 
          className="z-10 relative flex items-center justify-center w-full h-full"
          gradientBackgroundStart="rgba(56, 189, 248, 0.5)"
          gradientBackgroundEnd="rgba(192, 132, 252, 0.5)"
          firstColor="56, 189, 248"
          secondColor="129, 140, 248"
          thirdColor="192, 132, 252"
          fourthColor="232, 121, 249"
          fifthColor="34, 211, 238"
          pointerColor="140, 100, 255"
          size="250%"
          blendingValue="screen"
          interactive={true}
        />
      </div>

      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 relative">
        {/* Form content area with proper z-index to appear above mobile gradient */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Desktop gradient background (only visible on md and up) */}
        <div className="relative w-full z-20 hidden md:flex overflow-hidden bg-gradient-to-br from-sky-500/30 via-indigo-500/30 to-purple-500/30 dark:from-sky-400/40 dark:via-indigo-400/40 dark:to-purple-400/40 items-center justify-center">
          <BackgroundGradientAnimation 
            containerClassName="absolute inset-0 z-0 !h-full !w-full" 
            className="z-10 relative flex items-center justify-center w-full h-full"
            gradientBackgroundStart="rgba(56, 189, 248, 0.5)"
            gradientBackgroundEnd="rgba(192, 132, 252, 0.5)"
            firstColor="56, 189, 248"
            secondColor="129, 140, 248"
            thirdColor="192, 132, 252"
            fourthColor="232, 121, 249"
            fifthColor="34, 211, 238"
            pointerColor="140, 100, 255"
            size="250%"
            blendingValue="screen"
            interactive={true}
          >
            <div className="max-w-sm mx-auto z-20 relative p-6 flex flex-col items-center backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-xl shadow-lg">
              {/* <FeaturedTestimonials /> */}
              <div className="flex justify-center">
                <Logo size="text-2xl" />
              </div>
              <p
                className={cn(
                  "font-semibold text-xl text-center text-muted dark:text-white mt-4"
                )}
              >
                See the conversation.
              </p>
              <p
                className={cn(
                  "font-normal text-base text-center text-neutral-700 dark:text-neutral-200 mt-6"
                )}
              >
                Heard transcribes and organizes all of your conversations.
              </p>
            </div>
          </BackgroundGradientAnimation>
        </div>
      </div>
    </>
  );
}
