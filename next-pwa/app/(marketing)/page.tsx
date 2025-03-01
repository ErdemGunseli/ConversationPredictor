"use client";

import { Container } from "@/components/ui/container";
import { Hero } from "@/components/landing/hero";
import { Background } from "@/components/ui/background";
import { Features } from "@/components/landing/features";
import { Companies } from "@/components/landing/companies";
import { GridFeatures } from "@/components/landing/grid-features";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Footer } from "@/components/landing/footer";
import { StatsWithNumberTicker } from "@/components/ui/stats";
import { Lamp } from "@/components/ui/lamp";
import { SidebarWithHover } from "@/components/ui/sidebar";
import { NavBar } from "@/components/navbar";
import { ConversationRecorder } from "@/components/ui/conversation-recorder";


export default function Home() {
  const { userLoggedIn } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const loggedIn = await userLoggedIn();
        setIsLoggedIn(Boolean(loggedIn));
      } catch (error) {
        setIsLoggedIn(false);
      }
      setLoading(false);
    };
    checkLoggedIn();

    window.scrollTo(0, 0);
  }, [userLoggedIn]);


  if (loading) {
    return null;
  }

  if (isLoggedIn) {
    return (
      <div className="relative">
        <SidebarWithHover />
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <Background />
      </div>
      <Hero />
      <Container className="flex min-h-screen flex-col items-center justify-between">
        <div className="p-4 border border-neutral-200 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 rounded-[32px] mt-20 relative">
          <div className="absolute inset-x-0 bottom-0 h-40 w-full bg-gradient-to-b from-transparent via-white to-white dark:via-black/50 dark:to-black scale-[1.1] pointer-events-none" />
          <div className="p-2 bg-white dark:bg-black dark:border-neutral-700 border border-neutral-200 rounded-[24px]">
            <Image
              src="/header.png"
              alt="header"
              width={1920}
              height={1080}
              className="rounded-[20px]"
            />
          </div>
        </div>
        {/* TODO: Add companies */}
        {/* <Companies /> */}
        <Features />
        <StatsWithNumberTicker />
        {/* TODO: Add testimonials */}
        {/* <Testimonials /> */}
      </Container>
      <Lamp >
        Two-way conversation enabled by AR glasses
      </Lamp>
      <div className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <Background />
        </div>
        <CTA />
        <Footer />
      </div>
    </div>
    </>
  );
}
