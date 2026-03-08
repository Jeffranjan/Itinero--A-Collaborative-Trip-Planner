"use client";

import { motion } from "framer-motion";

interface MemberAvatarProps {
  name: string;
  role: "owner" | "editor" | "viewer";
  status?: "viewing" | "editing" | "offline";
}

export function MemberAvatar({
  name,
  role,
  status = "offline",
}: MemberAvatarProps) {
  // Extract initials
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Define border color based on role
  const ringColor =
    role === "owner"
      ? "ring-accent-orange"
      : role === "editor"
        ? "ring-blue-500"
        : "ring-gray-500";

  return (
    <div className="group relative flex items-center justify-center">
      <motion.div
        whileHover={{ zIndex: 10, scale: 1.1, y: -2 }}
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-card-dark text-sm font-semibold text-white shadow-lg ring-2 ${ringColor} relative transition-transform`}
      >
        {initials}

        {/* Presence Indicator */}
        {status !== "offline" && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-background-dark ${
              status === "editing" ? "bg-accent-orange" : "bg-green-500"
            }`}
          />
        )}
      </motion.div>

      {/* Tooltip */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
        {name} • <span className="capitalize">{role}</span>
        {status !== "offline" && (
          <span> • {status === "editing" ? "Editing" : "Online"}</span>
        )}
      </div>
    </div>
  );
}
