"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckSquare, CalendarCheck, FileText, PieChart } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    id: "checklists",
    title: "Group Checklists",
    description:
      "Never forget a thing. Create packing lists and to-dos, assign them to members, and track progress together.",
    icon: <CheckSquare className="h-6 w-6 text-yellow-500" />,
    mockup: (
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#161616] p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-white/20" />
          <div className="h-4 w-8 rounded bg-yellow-500/20" />
        </div>
        {[true, false, true].map((checked, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#1A1A1A] p-3"
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded ${checked ? "bg-yellow-500" : "border border-white/20"}`}
            >
              {checked && <div className="h-2 w-2 rounded-sm bg-black" />}
            </div>
            <div className="h-3 w-3/4 rounded bg-white/10" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "reservations",
    title: "Reservations Manager",
    description:
      "Keep all your bookings in one place. Flights, hotels, activities - accessible to everyone on your trip.",
    icon: <CalendarCheck className="h-6 w-6 text-purple-500" />,
    mockup: (
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#161616] p-5 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-500">
            ✈️
          </div>
          <div>
            <div className="mb-1 h-3 w-20 rounded bg-white/20" />
            <div className="h-2 w-16 rounded bg-white/10" />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="space-y-1">
            <div className="h-4 w-12 rounded bg-white/20" />
            <div className="h-2 w-10 rounded bg-white/10" />
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="h-[1px] w-full border-t border-dashed border-white/20" />
            <div className="absolute h-2 w-2 rotate-45 border-r border-t border-white/20" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-12 rounded bg-white/20" />
            <div className="h-2 w-10 rounded bg-white/10" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "documents",
    title: "Trip Documents",
    description:
      "Important files always at hand. Upload tickets, PDFs, and guides for secure, offline-ready access.",
    icon: <FileText className="h-6 w-6 text-pink-500" />,
    mockup: (
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#161616] p-5 shadow-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-lg border border-white/5 bg-[#1A1A1A] p-4 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded bg-pink-500/10 text-pink-500">
              <FileText className="h-5 w-5" />
            </div>
            <div className="h-2 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "budget",
    title: "Budget Tracking",
    description:
      "Keep trip finances transparent. Track expenses, see who paid what, and settle up easily.",
    icon: <PieChart className="h-6 w-6 text-emerald-400" />,
    mockup: (
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#161616] p-5 shadow-2xl">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <div className="mb-1 h-2 w-16 rounded bg-white/10" />
            <div className="h-6 w-24 rounded bg-emerald-400/20" />
          </div>
          <div className="h-10 w-10 rounded-full border-4 border-emerald-400 border-r-white/10" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/5" />
                <div className="space-y-1">
                  <div className="h-3 w-16 rounded bg-white/20" />
                  <div className="h-2 w-10 rounded bg-white/10" />
                </div>
              </div>
              <div className="h-3 w-12 rounded bg-emerald-400/50" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function AdvancedFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      features.forEach((feature, index) => {
        const row = `.feature-row-${index}`;
        const text = `${row} .feature-text`;
        const mockup = `${row} .feature-mockup`;

        // Text fades up
        gsap.fromTo(
          text,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Mockup slides in
        const slideDirection = index % 2 === 0 ? 50 : -50;
        gsap.fromTo(
          mockup,
          { opacity: 0, x: slideDirection },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Add subtle floating to mockups
        gsap.to(mockup, {
          y: "-5px",
          rotation: "1deg",
          duration: 3 + index * 0.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-10 mx-auto w-full max-w-[1200px] overflow-hidden px-6 py-24 sm:py-32"
    >
      <div className="mb-20 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Advanced Tools for Power Planners
        </h2>
        <p className="mx-auto max-w-[600px] text-lg text-gray-400">
          Everything you need to level up your group trip experience.
        </p>
      </div>

      <div className="flex flex-col gap-24">
        {features.map((feature, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={feature.id}
              className={`feature-row-${index} flex flex-col items-center gap-10 md:gap-16 ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Text Side */}
              <div className="feature-text flex flex-1 flex-col justify-center text-center md:text-left">
                <div
                  className={`mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-xl md:mx-0`}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="text-lg leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>

              {/* Mockup Side */}
              <div className="feature-mockup perspective-1000 w-full max-w-[400px] flex-1">
                <div className="relative">
                  {/* Backdrop glow */}
                  <div className="absolute inset-0 -z-10 scale-90 rounded-full bg-white/5 blur-3xl"></div>
                  {feature.mockup}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
