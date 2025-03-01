"use client";
import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { useState, useEffect } from "react";
import { IoIosMenu } from "react-icons/io";
import { IoIosClose } from "react-icons/io";
import { Button } from "../ui/button";
import { Logo } from "../ui/Logo";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ModeToggle } from "../ui/mode-toggle";
import { AuthButton } from "../auth/auth-button";


export const MobileNavbar = ({ navItems }: any) => {
  const [open, setOpen] = useState(false);

  const { scrollY } = useScroll();
  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });


  return (
    <div
      className={cn(
        "flex justify-between bg-white dark:bg-neutral-900 items-center w-full rounded-full px-2.5 py-1.5 transition duration-200",
        showBackground &&
          "bg-neutral-50 dark:bg-neutral-900 shadow-[0px_-2px_0px_0px_var(--neutral-100),0px_2px_0px_0px_var(--neutral-100)] dark:shadow-[0px_-2px_0px_0px_var(--neutral-800),0px_2px_0px_0px_var(--neutral-800)]"
      )}
    >
      <Link href="/">
        <Logo size={"text-xl"} />
      </Link>
      <IoIosMenu
        className="text-black dark:text-white h-6 w-6"
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col items-center px-8 pt-5 text-xl text-zinc-600 transition duration-200 hover:text-zinc-800">
          {/* Header */}
          <div className="w-full flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <IoIosClose
                className="h-8 w-8 text-black dark:text-white"
                onClick={() => setOpen(!open)}
              />
            </div>
          </div>
          {/* Navigation Links */}
          <div className="w-full flex flex-col items-start gap-4 mt-6">
            {navItems.map((navItem: any, idx: number) =>
              navItem.children && navItem.children.length > 0 ? (
                navItem.children.map((childNavItem: any, childIdx: number) => (
                  <Link
                    key={`child-link-${childIdx}`}
                    href={childNavItem.link}
                    onClick={() => setOpen(false)}
                    className="relative max-w-[15rem] text-left text-2xl"
                  >
                    <span className="block text-black">
                      {childNavItem.title}
                    </span>
                  </Link>
                ))
              ) : (
                <Link
                  key={`link-${idx}`}
                  href={navItem.link}
                  onClick={() => setOpen(false)}
                  className="relative"
                >
                  <span className="block text-[26px] text-black dark:text-white">
                    {navItem.title}
                  </span>
                </Link>
              )
            )}
          </div>
          {/* Login/Logout Buttons */}
          <div className="w-full flex justify-center mt-6">
          <AuthButton />
          </div>
        </div>
      )}
    </div>
  );
};
