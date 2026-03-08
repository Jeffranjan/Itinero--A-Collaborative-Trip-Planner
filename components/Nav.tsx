"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

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
          <Image
            src="/images/iteneroLogo.png"
            alt="Itinero Logo"
            width={260}
            height={90}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "Home", href: "/" },
            { label: "Planner", href: "/dashboard" },
            { label: "Features", href: "#features" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative px-2 py-1 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              {item.label}
              <motion.span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent-orange transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {!isLoading &&
            (user ? (
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className="hidden rounded-full border border-white/10 bg-white/5 px-6 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 sm:inline-flex"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>

                {/* Profile menu/button */}
                <div className="group relative">
                  <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-4 transition-all hover:border-accent-orange/50 hover:bg-white/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-orange to-orange-400 font-bold uppercase text-white shadow-sm">
                      {user.name?.[0] || user.email?.[0] || "?"}
                    </div>
                    <span className="hidden text-sm font-medium text-gray-200 sm:block">
                      {user.name?.split(" ")[0] || "Profile"}
                    </span>
                  </button>

                  {/* Dropdown */}
                  <div className="pointer-events-none absolute right-0 top-full pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0D0D0D] shadow-2xl">
                      <div className="cursor-default border-b border-white/5 bg-white/5 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-white">
                          {user.name || "Explorer"}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="cursor-pointer p-2">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                asChild
                className="hidden rounded-full bg-accent-orange px-6 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] sm:inline-flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            ))}

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
