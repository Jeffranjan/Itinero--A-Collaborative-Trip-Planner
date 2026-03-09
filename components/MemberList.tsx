"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { memberService } from "@/services/member.service";
import { MemberAvatar } from "./MemberAvatar";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

import { TripPresence } from "@/services/presence.service";

interface MemberListProps {
  tripId: string;
  isOwner: boolean;
  activeUsers: TripPresence[];
}

export function MemberList({ tripId, isOwner, activeUsers }: MemberListProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#invite-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = (role: "viewer" | "editor") => {
    const inviteLink = `${window.location.origin}/join-trip?tripId=${tripId}&role=${role}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success(
      `${role.charAt(0).toUpperCase() + role.slice(1)} invite link copied!`
    );
    setIsDropdownOpen(false);
  };

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await memberService.getTripMembers(tripId);
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Realtime updates for live avatars
  useRealtimeSubscription(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_members.documents`,
    useCallback(
      (event) => {
        const payload = event.payload as any;
        if (payload.tripId === tripId) {
          fetchMembers();
        }
      },
      [tripId, fetchMembers]
    )
  );

  if (isLoading) {
    return (
      <div className="flex -space-x-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full border-2 border-background-dark bg-white/5"
          />
        ))}
      </div>
    );
  }

  // Deduplicate members by user ID to handle any old bad data
  const uniqueMembers = Array.from(
    new Map(members.map((m) => [m.userId, m])).values()
  );

  // Sort: Owner first
  const sortedMembers = uniqueMembers.sort((a, b) => {
    if (a.role === "owner") return -1;
    if (b.role === "owner") return 1;
    return 0;
  });

  return (
    <>
      <div className="flex items-center">
        <div className="relative z-10 flex -space-x-3 transition-all hover:space-x-1">
          {sortedMembers.map((member) => (
            <div key={member.$id} className="relative z-10">
              <MemberAvatar
                name={member.name || "Unknown"}
                avatarInitial={member.avatarInitial}
                role={member.role}
                status={
                  activeUsers.find((u) => u.userId === member.userId)?.status ||
                  "offline"
                }
              />
            </div>
          ))}
        </div>

        {isOwner && (
          <div id="invite-dropdown-container" className="relative ml-4">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-gray-600 bg-transparent transition-colors hover:border-accent-orange hover:bg-accent-orange/10"
            >
              <Plus className="h-4 w-4 text-gray-400 group-hover:text-accent-orange" />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-card-dark shadow-xl"
                >
                  <div className="p-1">
                    <button
                      onClick={() => handleCopyLink("viewer")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                      Copy Viewer Link
                    </button>
                    <button
                      onClick={() => handleCopyLink("editor")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                      Copy Editor Link
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
