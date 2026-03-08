"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { fadeUp } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={fadeUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex min-h-screen w-full flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
