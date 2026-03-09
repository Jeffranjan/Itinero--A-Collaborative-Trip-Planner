"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Activity,
  CreditCard,
  User,
  ArrowRight,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Nav } from "@/components/Nav";
import { tripService } from "@/services/trip.service";
import { Trip } from "@/types/trip";
import { Button } from "@/components/ui/button";
import { CreateTripModal } from "@/components/CreateTripModal";
import { TransitionWrapper } from "@/components/TransitionWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";

function DashboardContent() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsData, setTripsData] = useState<
    {
      tripId: string;
      daysCount: number;
      membersCount: number;
      activitiesCount: number;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const userTrips = await tripService.getUserTrips(user!.$id);
      setTrips(userTrips);

      const dataCounts = await Promise.all(
        userTrips.map(async (trip) => {
          const days = await tripService.getTripDays(trip.$id);
          // TODO: fetch real counts
          return {
            tripId: trip.$id,
            daysCount: days.length,
            membersCount: 2,
            activitiesCount: days.length * 3,
          };
        })
      );
      setTripsData(dataCounts);
    } catch (error) {
      console.error("Failed to load trips:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user, loadTrips]);

  const stats = useMemo(() => {
    const totalTrips = trips.length;
    let collaborators = 0;
    let activitiesPlanned = 0;
    if (totalTrips > 0) {
      collaborators = tripsData.reduce(
        (acc, curr) => acc + curr.membersCount,
        0
      );
      activitiesPlanned = tripsData.reduce(
        (acc, curr) => acc + curr.activitiesCount,
        0
      );
    }
    const expensesLogged = totalTrips * 12; // placeholder
    return { totalTrips, collaborators, activitiesPlanned, expensesLogged };
  }, [trips, tripsData]);

  const nextUpcomingTrip = useMemo(() => {
    const upcoming = trips
      .filter((t) => new Date(t.startDate) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    return upcoming[0] || null;
  }, [trips]);

  if (isAuthLoading || (isLoading && trips.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-orange border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const statCards = [
    { label: "Total Trips", value: stats.totalTrips, icon: MapPin },
    { label: "Collaborators", value: stats.collaborators, icon: Users },
    {
      label: "Activities Planned",
      value: stats.activitiesPlanned,
      icon: Activity,
    },
    { label: "Expenses Logged", value: stats.expensesLogged, icon: CreditCard },
  ];

  return (
    <TransitionWrapper>
      <div className="min-h-screen bg-background-dark font-[family-name:var(--font-geist-sans)]">
        <Nav />

        <main className="mx-auto max-w-[1200px] px-6 pb-12 pt-32">
          {/* Dashboard Header - Premium Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 shadow-xl backdrop-blur-md"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-orange to-orange-400 text-3xl font-bold uppercase text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)] ring-4 ring-white/5">
                  {user.name?.[0] || user.email?.[0] || "?"}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Welcome back, {user.name?.split(" ")[0] || "Explorer"}! 👋
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {trips.length} Active Trips
                    </span>
                    <span className="text-white/20">•</span>
                    {nextUpcomingTrip ? (
                      <span className="flex items-center gap-1 font-medium text-accent-orange">
                        Next: {nextUpcomingTrip.title}
                      </span>
                    ) : (
                      <span>No upcoming trips</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  className="w-full bg-accent-orange text-white transition-all hover:bg-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] sm:w-auto"
                >
                  <Plus className="mr-2 h-5 w-5" /> Create Trip
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Stats Row */}
          <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-orange/10 text-accent-orange">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Your Trips
            </h2>
          </div>

          {trips.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-card-dark p-12 text-center shadow-lg"
            >
              <div className="mb-4 rounded-full bg-accent-orange/10 p-4 text-accent-orange">
                <MapPin className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                No trips yet
              </h2>
              <p className="mb-6 text-gray-400">
                Create your first trip and start planning your next adventure.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-accent-orange text-white hover:bg-orange-600"
              >
                <Plus className="mr-2 h-4 w-4" /> Create your first trip
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, idx) => {
                const daysData = tripsData.find((d) => d.tripId === trip.$id);
                const totalDays =
                  differenceInDays(
                    new Date(trip.endDate),
                    new Date(trip.startDate)
                  ) + 1;
                const plannedDays = daysData ? daysData.daysCount : 0;
                const progress =
                  totalDays > 0
                    ? Math.round((plannedDays / totalDays) * 100)
                    : 0;

                return (
                  <motion.div
                    key={trip.$id}
                    layout
                    layoutId={`trip-${trip.$id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link href={`/trip/${trip.$id}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-card-dark p-6 transition-all duration-300 hover:border-accent-orange/50 hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)]"
                      >
                        <div>
                          <h3 className="mb-2 truncate text-xl font-semibold text-white transition-colors group-hover:text-accent-orange">
                            {trip.title}
                          </h3>
                          {trip.description && (
                            <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                              {trip.description}
                            </p>
                          )}

                          <div className="mt-4 space-y-3 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-accent-orange/80" />
                              <span>
                                {format(new Date(trip.startDate), "MMM d")} -{" "}
                                {format(new Date(trip.endDate), "MMM d, yyyy")}
                              </span>
                            </div>

                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between text-xs">
                                <span>Planning Progress</span>
                                <span className="text-white">{progress}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                  className="h-full bg-accent-orange"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                          <div className="flex -space-x-2">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card-dark bg-gray-700 text-xs font-medium text-white shadow-sm"
                              >
                                <User className="h-4 w-4" />
                              </div>
                            ))}
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card-dark bg-white/10 text-xs font-medium text-white shadow-sm">
                              <Plus className="h-3 w-3" />
                            </div>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors group-hover:bg-accent-orange/10 group-hover:text-accent-orange">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>

        <CreateTripModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={user.$id}
        />
      </div>
    </TransitionWrapper>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
