"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, MapPin, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { tripService } from "@/services/trip.service";
import { memberService } from "@/services/member.service";
import { Trip } from "@/types/trip";
import { Button } from "@/components/ui/Button";
import { AuthGuard } from "@/components/auth/AuthGuard";

function JoinTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const urlRole = searchParams.get("role");

  // Strictly validate role
  const joiningRole: "viewer" | "editor" =
    urlRole === "editor" ? "editor" : "viewer";

  const { user, isLoading: isAuthLoading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchTripDetails = useCallback(async () => {
    if (!tripId) {
      setErrorStatus("Invalid invite link.");
      setIsLoading(false);
      return;
    }

    try {
      const tripData = await tripService.getTrip(tripId);
      setTrip(tripData);
    } catch (error) {
      console.error("Failed to load trip:", error);
      setErrorStatus("Trip not found or it has been deleted.");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  const handleJoin = async () => {
    if (!tripId || !user) return;

    try {
      setIsJoining(true);
      await memberService.joinTrip(tripId, user.$id, joiningRole);
      toast.success(`Successfully joined the trip as ${joiningRole}!`);
      router.push(`/trip/${tripId}`);
    } catch (error: any) {
      console.error("Failed to join:", error);
      toast.error(error.message || "Failed to join trip.");

      // If they are already a member, just route them there.
      if (error.message?.includes("already a member")) {
        router.push(`/trip/${tripId}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (isAuthLoading || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    );
  }

  if (errorStatus || !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark p-6 font-[family-name:var(--font-geist-sans)]">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-card-dark p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <MapPin className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Oops!</h1>
          <p className="mb-8 text-gray-400">{errorStatus}</p>
          <Link href="/dashboard">
            <Button className="w-full bg-white/10 text-white hover:bg-white/20">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark px-4 font-[family-name:var(--font-geist-sans)]">
      {/* Background Decor */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card-dark shadow-2xl shadow-black/50"
      >
        <div className="bg-gradient-to-br from-accent-orange/20 to-transparent p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-orange to-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <MapPin className="h-10 w-10" />
          </div>
          <h1 className="mb-2 text-xl font-medium text-gray-300">
            You&apos;ve been invited to join
          </h1>
          <h2 className="text-3xl font-bold text-white">{trip.title}</h2>
        </div>

        <div className="p-8">
          <div className="mb-8 space-y-4 rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Users className="h-5 w-5 text-gray-500" />
              <span>
                Join as an{" "}
                {joiningRole.charAt(0).toUpperCase() + joiningRole.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-accent-orange" />
              <span>
                {joiningRole === "editor"
                  ? "Help plan the itinerary and manage activities"
                  : "Keep up with the group&apos;s itinerary"}
              </span>
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full bg-gradient-to-r from-accent-orange to-orange-500 py-6 text-lg font-medium text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            {isJoining ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "Accept Invite"
            )}
          </Button>

          <div className="mt-6 text-center">
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              Cancel and return home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function JoinTripPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background-dark">
            <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
          </div>
        }
      >
        <JoinTripContent />
      </Suspense>
    </AuthGuard>
  );
}
