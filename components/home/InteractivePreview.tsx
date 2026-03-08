"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function InteractivePreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        ".preview-dashboard",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      )
        .fromTo(
          ".preview-itinerary",
          { opacity: 0, x: -50 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
          "-=0.3"
        )
        .fromTo(
          ".preview-budget",
          { opacity: 0, x: 50 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
          "-=0.4"
        );

      // Add slow float
      gsap.to([".preview-dashboard", ".preview-itinerary", ".preview-budget"], {
        y: "-8px",
        rotation: "0.5deg",
        duration: 4,
        stagger: 0.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 w-full overflow-hidden border-y border-white/5 bg-[#111] py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/5 opacity-50 blur-[100px]" />

      <div
        ref={containerRef}
        className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-12 px-6"
      >
        <div className="mb-10 max-w-2xl text-center">
          <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            See it all come together.
          </h2>
          <p className="text-lg text-gray-400 sm:text-xl">
            Experience a complete overview of your entire trip, beautifully
            designed to give you clarity and control.
          </p>
        </div>

        <div className="relative h-[400px] w-full max-w-4xl sm:h-[500px]">
          {/* Main Dashboard Mockup */}
          <div className="preview-dashboard absolute left-1/2 top-0 z-10 h-64 w-full max-w-2xl -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-2xl sm:h-80">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent-orange/20" />
                <div>
                  <div className="mb-1 h-3 w-32 rounded-full bg-white/20" />
                  <div className="h-2 w-20 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
              </div>
            </div>
            <div className="grid h-full grid-cols-2 gap-4">
              <div className="h-24 rounded-lg bg-white/5 p-4 mix-blend-screen"></div>
              <div className="h-24 rounded-lg bg-white/5 p-4 mix-blend-screen"></div>
              <div className="col-span-2 h-16 rounded-lg bg-white/5 p-4 mix-blend-screen"></div>
            </div>
          </div>

          {/* Itinerary Mockup */}
          <div className="preview-itinerary absolute bottom-0 left-0 z-20 w-64 rounded-xl border border-white/10 bg-[#222] p-5 shadow-2xl sm:left-10">
            <h4 className="mb-4 text-sm font-semibold text-white">Timeline</h4>
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent md:before:mx-auto md:before:translate-x-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="z-10 mt-1 h-4 w-4 rounded-full bg-accent-orange/50 ring-4 ring-[#222]" />
                  <div className="flex-1">
                    <div className="mb-2 h-3 w-2/3 rounded bg-white/20" />
                    <div className="h-2 w-full rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Mockup */}
          <div className="preview-budget absolute bottom-10 right-0 z-30 w-56 rounded-xl border border-white/10 bg-[#1C1C1C] p-5 shadow-xl sm:right-10">
            <h4 className="mb-4 text-sm font-semibold text-white">Expenses</h4>
            <div className="mb-4 flex justify-center">
              <div className="h-24 w-24 rounded-full border-8 border-emerald-400 border-b-emerald-800 border-r-emerald-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-2 w-12 rounded bg-emerald-400" />
                <div className="h-2 w-8 rounded bg-white/20" />
              </div>
              <div className="flex justify-between">
                <div className="h-2 w-16 rounded bg-emerald-600" />
                <div className="h-2 w-8 rounded bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
