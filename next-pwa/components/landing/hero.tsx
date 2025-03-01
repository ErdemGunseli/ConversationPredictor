"use client";

import Balancer from "react-wrap-balancer";
import { Button } from "../ui/button";
import { HiArrowRight } from "react-icons/hi2";
import { Badge } from "./badge";
import { motion } from "framer-motion";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Link } from "next-view-transitions";
import { WavyBackground } from "../ui/wavy-background";

export const Hero = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col pt-20 md:pt-40 relative overflow-hidden">
      <motion.div
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
        }}
        className="flex justify-center"
      >
          {/* TODO: Add badge */}
          {/* <Badge onClick={() => router.push("/blog/top-5-llm-of-all-time")}>
            We&apos;ve raised $69M seed funding
          </Badge> */}
        </motion.div>

        <WavyBackground className="mx-auto">

        <motion.h1
          initial={{
            y: 40,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            ease: "easeOut",
            duration: 0.5,
          }}
          className="font-semibold max-w-6xl mx-auto text-center mt-6 relative z-10"
          style={{ fontSize: "clamp(2rem, 8vw, 6rem)" }}
        >
          <Balancer>
            See the conversation
          </Balancer>
        </motion.h1>


        <motion.p
          initial={{
            y: 40,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            ease: "easeOut",
            duration: 0.5,
            delay: 0.2,
          }}
          className="text-center mt-6 text-base md:text-xl text-muted dark:text-muted-dark max-w-3xl mx-auto relative z-10"
        >
          <Balancer className="px-4">
            Heard transcribes and organizes all of your conversations.
          </Balancer>
        </motion.p>


        <motion.div
          initial={{
            y: 80,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            ease: "easeOut",
            duration: 0.5,
            delay: 0.4,
          }}
          className="flex items-center gap-4 justify-center mt-6 relative z-10"
        >
          <Link href="/signup">
            <Button>Get started</Button>
          </Link>
          <Button
            variant="simple"
            as={Link}
            href="/contact"
            className="flex space-x-2 items-center group"
          >
            <span>Contact us</span>
            <HiArrowRight className="text-muted group-hover:translate-x-1 stroke-[1px] h-3 w-3 transition-transform duration-200 dark:text-muted-dark" />
          </Button>
        </motion.div>
        </WavyBackground>

    </div>
  );
};
