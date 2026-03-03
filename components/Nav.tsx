"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed left-0 right-0 top-0 z-[100] w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/5 bg-[#0D0D0D]/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-orange to-orange-400 text-xl font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            TripPlanner
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {["Home", "Itinerary Builder", "Explore", "Stay"].map((item) => (
            <Link
              key={item}
              href="#"
              className="group relative text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              {item}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-orange transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="hidden rounded-full bg-accent-orange px-6 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] sm:inline-flex"
          >
            <Link href="/login">Sign In</Link>
          </Button>

          {/* Mobile Menu Toggle (Visual only for now) */}
          <button className="p-2 text-white md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
