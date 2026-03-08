"use client";

import { useEffect, useRef } from "react";
import { LogIn, CalendarPlus, Share2 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollReveal } from "@/hooks/useScrollReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    step: "01",
    title: "Create a Trip",
    desc: "Set your dates, destination, and give your trip a unique name to get started.",
    icon: <LogIn className="h-8 w-8 text-accent-orange" />,
  },
  {
    step: "02",
    title: "Plan Activities",
    desc: "Flesh out your itinerary. Craft the perfect schedule day by day.",
    icon: <CalendarPlus className="h-8 w-8 text-blue-500" />,
  },
  {
    step: "03",
    title: "Invite Collaborators",
    desc: "Share a link with your friends and start planning together in real-time.",
    icon: <Share2 className="h-8 w-8 text-green-500" />,
  },
];

export function WorkflowTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useScrollReveal({ stagger: 0.2, yOffset: 40 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line progress animation
      gsap.fromTo(
        ".timeline-line-progress",
        { height: "0%" },
        {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top center",
            end: "bottom center",
            scrub: 1,
          },
        }
      );

      // Step indicators hover animation
      const icons = gsap.utils.toArray(".timeline-icon-container");
      icons.forEach((icon: any) => {
        icon.addEventListener("mouseenter", () =>
          gsap.to(icon, { scale: 1.1, duration: 0.3, ease: "back.out(1.7)" })
        );
        icon.addEventListener("mouseleave", () =>
          gsap.to(icon, { scale: 1, duration: 0.3 })
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="demo"
      ref={containerRef}
      className="relative z-10 mx-auto w-full max-w-[1000px] px-6 py-24 sm:py-32"
    >
      <div className="mb-20 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Complete planning in 3 steps
        </h2>
        <p className="mx-auto max-w-[600px] text-lg text-gray-400">
          Get your entire trip organized quickly with our intuitive workflow.
        </p>
      </div>

      <div className="relative">
        {/* Background Line */}
        <div className="absolute left-[39px] top-0 h-full w-0.5 bg-white/10 md:left-1/2 md:-translate-x-px" />

        {/* Progress Line */}
        <div className="timeline-line-progress absolute left-[39px] top-0 w-0.5 bg-gradient-to-b from-accent-orange via-blue-500 to-green-500 md:left-1/2 md:-translate-x-px" />

        <div
          ref={revealRef as any}
          className="relative z-10 flex flex-col gap-16 sm:gap-24"
        >
          {steps.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className="relative w-full md:flex md:items-center"
              >
                {/* Icon Marker */}
                <div className="timeline-icon-container absolute left-[40px] top-1/2 z-10 -ml-10 -mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-xl md:left-1/2 md:ml-0 md:-translate-x-1/2 md:-translate-y-1/2 md:p-0">
                  {item.icon}
                  <div className="absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg">
                    {item.step}
                  </div>
                </div>

                {/* Content Box */}
                <div
                  className={`w-full pl-28 md:w-1/2 md:pl-0 ${
                    isEven ? "md:ml-auto md:pl-24" : "md:mr-auto md:pr-24"
                  }`}
                >
                  <div
                    className={`rounded-xl border border-white/10 bg-[#161616]/50 p-6 text-left shadow-2xl backdrop-blur-sm transition-colors hover:border-white/30 ${
                      !isEven ? "md:text-right" : ""
                    }`}
                  >
                    <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="leading-relaxed text-gray-400">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
