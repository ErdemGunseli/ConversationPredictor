"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
export const Logo = ({ size = "text-sm" }) => {
  const handleLogoClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Link
      href="/"
      onClick={handleLogoClick}
      className={`font-normal flex space-x-2 items-center ${size} mr-4 text-black px-2 py-1 relative z-20`}
    >
      <div className="p-1">
        <Image
          src="/logos/logo512.png"
          alt="Logo"
          width={32}
          height={32}
          className="rounded-full"
        />
      </div>
      <span className="font-medium text-black dark:text-white">Heard</span>
    </Link>
  );
};
