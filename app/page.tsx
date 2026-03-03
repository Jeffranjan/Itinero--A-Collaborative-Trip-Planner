"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Search } from "lucide-react";
import { Nav } from "@/components/Nav";

const TABS = [
  {
    id: "all",
    label: "Search All",
    placeholder: "Places, activities, hotels...",
  },
  {
    id: "itinerary",
    label: "Itinerary Builder",
    placeholder: "Create or search itineraries...",
  },
  {
    id: "things",
    label: "Things To Do",
    placeholder: "Attractions, tours, experiences...",
  },
  { id: "stay", label: "Stay", placeholder: "Hotels, restaurants..." },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    // GSAP staggered reveal for hero section
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      tl.fromTo(
        ".hero-badge",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, delay: 0.1 }
      )
        .fromTo(
          ".hero-heading .word",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.1 },
          "-=0.4"
        )
        .fromTo(
          ".hero-tabs .tab-item",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.05 },
          "-=0.4"
        )
        .fromTo(
          ".hero-search",
          { opacity: 0, scale: 0.95, y: 20 },
          { opacity: 1, scale: 1, y: 0 },
          "-=0.3"
        );
    }, heroRef);

    return () => ctx.revert(); // Proper cleanup of GSAP effects
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-x-hidden font-[family-name:var(--font-geist-sans)]">
      <Nav />
      {/* Background radial gradient glow behind hero */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent-orange/10 opacity-60 blur-3xl sm:h-[800px] sm:w-[800px]" />

      {/* Hero Section Container */}
      <section
        ref={heroRef}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center justify-center px-6 pb-12 pt-32 text-center"
      >
        <div className="hero-badge mb-8 inline-flex items-center rounded-full border border-accent-orange/20 bg-accent-orange/10 px-4 py-1.5 text-sm font-medium text-accent-orange-light">
          ✨ The Ultimate Trip Planning Experience
        </div>

        <h1 className="hero-heading mb-12 max-w-[850px] text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[80px]">
          <span className="word inline-block">Plan</span>{" "}
          <span className="word inline-block">Trips</span>{" "}
          <span className="word inline-block bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-sm">
            Together
          </span>
        </h1>

        {/* Dynamic TripAdvisor-style Tab & Search block */}
        <div className="flex w-full max-w-3xl flex-col items-center">
          {/* Category Tabs */}
          <div className="hero-tabs mb-6 flex w-full flex-wrap justify-center gap-2 border-b border-white/10 px-2 sm:gap-6">
            {TABS.map((tab) => {
              const isActive = activeTab.id === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-item relative px-4 py-3 text-sm font-medium transition-colors sm:text-base ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-orange"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="hero-search group relative w-full">
            <div className="absolute inset-0 rounded-full bg-accent-orange/5 blur-xl transition-all duration-300 group-focus-within:bg-accent-orange/20 group-focus-within:blur-2xl"></div>
            <div className="relative flex h-16 w-full items-center overflow-hidden rounded-full border border-white/10 bg-[#1A1A1A] shadow-2xl transition-all duration-300 focus-within:border-accent-orange/50 focus-within:ring-1 focus-within:ring-accent-orange/50">
              <div className="pl-6 pr-3 text-gray-400">
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <input
                type="text"
                placeholder={activeTab.placeholder}
                className="h-full flex-1 bg-transparent px-2 text-base text-white outline-none placeholder:text-gray-500 sm:text-lg"
              />
              <div className="pr-2">
                <button className="flex h-12 w-24 items-center justify-center rounded-full bg-accent-orange font-medium text-white transition-all duration-300 hover:scale-[1.05] hover:bg-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 sm:w-32">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Preview Section */}
      <section className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-24">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {[
            {
              title: "Real-time Collaboration",
              desc: "Sync your plans instantly with your entire group. No more confusing spreadsheets or long chat threads.",
            },
            {
              title: "Smart Itinerary Builder",
              desc: "Optimize your travel routes and schedules automatically with our intelligent planning engine.",
            },
            {
              title: "Budget Tracking",
              desc: "Keep everyone's spending clear and transparent. Split costs seamlessly during your trip.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="group relative rounded-xl border border-white/5 bg-card-dark p-8 shadow-sm transition-colors duration-300 hover:border-accent-orange/30 hover:shadow-[0_8px_30px_rgba(249,115,22,0.12)]"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-surface-dark transition-colors duration-300 group-hover:border-accent-orange/30 group-hover:bg-accent-orange/10">
                <div className="h-4 w-4 rounded-full bg-accent-orange/70 transition-colors duration-300 group-hover:bg-accent-orange group-hover:shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
