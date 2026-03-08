"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealOptions {
  delay?: number;
  stagger?: number;
  yOffset?: number;
}

export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const { delay = 0, stagger = 0.1, yOffset = 40 } = options;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Use querySelectorAll to get direct children, otherwise target the element itself
    const target =
      element.children.length > 0 ? Array.from(element.children) : element;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        {
          opacity: 0,
          y: yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: delay,
          stagger: stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, element);

    return () => ctx.revert();
  }, [delay, stagger, yOffset]);

  return ref;
};
