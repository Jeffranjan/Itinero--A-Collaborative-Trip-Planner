"use client";

import { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  yOffset?: number;
}

export const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  stagger = 0.1,
  yOffset = 40,
}: AnimatedSectionProps) => {
  const sectionRef = useScrollReveal({ delay, stagger, yOffset });

  return (
    <section ref={sectionRef} className={className}>
      {children}
    </section>
  );
};
