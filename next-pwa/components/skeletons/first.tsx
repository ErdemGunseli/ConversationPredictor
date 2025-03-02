"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { BlurImage } from "../ui/blur-image";

export const SkeletonOne = () => {
  return (
    <div className="relative w-full h-auto flex justify-center items-center">
        <Image
          src="/background_information.png"
          alt="header"
          width={1024}
          height={768}
          className="rounded-[20px] max-w-full max-h-full object-contain grayscale border-2 border-gray-300 dark:border-gray-700"
          priority
        />
    </div>
  );
};

const UserMessage = ({ children }: { children: React.ReactNode }) => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  return (
    <motion.div
      variants={variants}
      className="flex flex-row rounded-2xl  p-2  items-start space-x-2 bg-white dark:bg-neutral-900"
    >
      <Image
        src="/avatar.jpeg"
        alt="avatar"
        height="100"
        width="100"
        className="rounded-full h-4 w-4 md:h-10 md:w-10"
      />
      <p className="text-[10px] sm:text-sm text-neutral-500">{children}</p>
    </motion.div>
  );
};

const AIMessage = ({ children }: { children: React.ReactNode }) => {
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      transition: {
        duration: 0.2,
      },
    },
  };
  return (
    <motion.div
      variants={variantsSecond}
      className="flex flex-row rounded-2xl   p-2 items-center justify-start space-x-2  bg-white dark:bg-neutral-900 "
    >
      <div className="h-4 w-4 md:h-10 md:w-10 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex-shrink-0" />
      <p className="text-[10px] sm:text-sm text-neutral-500">{children}</p>
    </motion.div>
  );
};
