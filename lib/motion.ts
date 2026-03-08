import { Variants, Transition } from "framer-motion";

// Premium SaaS transition: cubic-bezier curve
export const transition: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.5,
};

// Reusable animation variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition },
  exit: { opacity: 0, transition },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: 10, transition },
};

export const fadeDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: -20, transition },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition },
  exit: { opacity: 0, scale: 0.95, transition },
};

export const modalEnter: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 10,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Reusable hover motion tokens
export const motionProps = {
  cardHover: {
    whileHover: {
      scale: 1.02,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    },
    whileTap: { scale: 0.98 },
  },
  buttonHover: {
    whileHover: {
      scale: 1.03,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    },
    whileTap: { scale: 0.97 },
  },
  iconHover: {
    whileHover: {
      rotate: 6,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    },
    whileTap: { scale: 0.95 },
  },
};
