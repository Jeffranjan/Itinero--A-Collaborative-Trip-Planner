"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MapPin, Clock, GripVertical } from "lucide-react";

export function FloatingTripPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Slow subtle floating movement for the entire board
      gsap.fromTo(
        ".floating-board",
        { y: -4, rotation: -1 },
        {
          y: 4,
          rotation: 1,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        }
      );

      // Slow vertical floating movement
      gsap.to(".floating-card", {
        y: "-15px",
        duration: 3,
        ease: "sine.inOut",
        stagger: {
          each: 0.5,
          yoyo: true,
          repeat: -1,
        },
        yoyo: true,
        repeat: -1,
      });

      // Mouse parallax depth effect (subtle)
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const diffX = (e.clientX - centerX) / 30;
        const diffY = (e.clientY - centerY) / 30;

        gsap.to(".floating-board", {
          x: diffX,
          y: diffY,
          rotationY: diffX * 0.5,
          rotationX: -diffY * 0.5,
          ease: "power2.out",
          duration: 1,
        });

        gsap.to(".floating-card-1", {
          x: diffX * 1.5,
          y: diffY * 1.5,
          duration: 1,
        });

        gsap.to(".floating-card-2", {
          x: diffX * 2,
          y: diffY * 2,
          duration: 1,
        });
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[500px] w-full max-w-[500px] items-center justify-center [perspective:1000px]"
    >
      {/* Background Board */}
      <div className="floating-board absolute h-[450px] w-[320px] rounded-2xl border border-white/10 bg-[#161616]/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-semibold text-white">Delhi Getaway</h3>
          <div className="flex -space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#161616] bg-blue-500 text-[10px] font-bold text-white">
              A
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#161616] bg-green-500 text-[10px] font-bold text-white">
              S
            </div>
          </div>
        </div>

        {/* Day 1 Container */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">Day 1</h4>
            <span className="text-xs text-gray-500">Oct 12</span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Card 1 */}
            <div className="floating-card floating-card-1 flex items-center gap-3 rounded-lg border border-white/10 bg-[#222222] p-3 shadow-lg">
              <GripVertical className="h-4 w-4 text-gray-600" />
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/20 text-orange-500">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Qutub Minar</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="mr-1 h-3 w-3" /> 10:00 AM
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="floating-card floating-card-2 flex items-center gap-3 rounded-lg border border-white/10 bg-[#222222] p-3 shadow-lg">
              <GripVertical className="h-4 w-4 text-gray-600" />
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/20 text-blue-500">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Lotus Temple</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="mr-1 h-3 w-3" /> 2:00 PM
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day 2 Skeleton Container */}
        <div>
          <div className="mb-3 flex items-center justify-between opacity-50">
            <h4 className="text-sm font-medium text-gray-300">Day 2</h4>
            <span className="text-xs text-gray-500">Oct 13</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#1A1A1A] p-3 opacity-50">
            <div className="h-8 w-8 shrink-0 rounded-md bg-white/5" />
            <div className="flex w-full flex-col gap-2">
              <div className="h-3 w-2/3 rounded-full bg-white/10" />
              <div className="h-2 w-1/3 rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
