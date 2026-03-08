"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import { FloatingTripPreview } from "./FloatingTripPreview";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Hero() {
  const glowRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle GSAP background glow animation
    const ctx = gsap.context(() => {
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.1,
          opacity: 0.8,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // GSAP Parallax movement for hero visual
      if (previewContainerRef.current) {
        gsap.to(previewContainerRef.current, {
          y: 100,
          ease: "none",
          scrollTrigger: {
            trigger: previewContainerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const headlineText = "Plan Trips Together";
  const words = headlineText.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden pt-20">
      {/* GSAP animated background glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent-orange/20 opacity-60 blur-[100px] sm:h-[700px] sm:w-[700px]"
      />

      <div className="z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8">
        {/* Left Side: Copy & CTA */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 inline-flex items-center rounded-full border border-accent-orange/20 bg-accent-orange/10 px-4 py-1.5 text-sm font-medium text-accent-orange-light"
          >
            ✨ The Ultimate Collaborative Trip Planner
          </motion.div>

          {/* Framer Motion stagger stagger animation for headline words */}
          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[72px]"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={item}
                className={
                  word === "Together"
                    ? "inline-block bg-gradient-to-r from-orange-400 via-accent-orange to-yellow-400 bg-clip-text text-transparent"
                    : "mr-3 inline-block lg:mr-4"
                }
              >
                {word}
                {word !== "Together" ? " " : ""}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="mb-10 max-w-[500px] text-lg leading-relaxed text-gray-300 sm:text-xl"
          >
            Build beautiful travel itineraries, organize your days, and
            collaborate with friends in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-accent-orange px-8 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              <Link href="/dashboard">Start Planning</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              <Link href="#demo">View Demo Trip</Link>
            </Button>
          </motion.div>
        </div>

        {/* Right Side: Floating UI Preview */}
        <div
          ref={previewContainerRef}
          className="relative hidden w-full justify-center lg:flex"
        >
          <FloatingTripPreview />
        </div>
      </div>
    </section>
  );
}
