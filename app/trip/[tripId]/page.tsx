"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays, isBefore } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Loader2,
  Plus,
  ArrowLeft,
  Trash2,
  MapPin,
  Edit2,
  MoreVertical,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { useAuth } from "@/hooks/useAuth";
import { tripService } from "@/services/trip.service";
import { activityService } from "@/services/activity.service";
import { memberService } from "@/services/member.service";
import {
  roleRequestService,
  RoleRequest,
} from "@/services/roleRequest.service";
import { TripDay, TripActivity } from "@/types/trip";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { AddActivityModal } from "@/components/AddActivityModal";
import { ActivityCard } from "@/components/ActivityCard";
import { MemberList } from "@/components/MemberList";
import { EditTripModal } from "@/components/EditTripModal";
import { RenameDayModal } from "@/components/RenameDayModal";

import { useTripPresence } from "@/hooks/useTripPresence";
import { TripPresence, presenceService } from "@/services/presence.service";
import { ImageUploadModal } from "@/components/ImageUploadModal";
import { ImageLightbox } from "@/components/ImageLightbox";
import { mediaService } from "@/services/media.service";
import { ChecklistTab } from "@/components/trip/ChecklistTab";
import { FilesTab } from "@/components/files/FilesTab";
import { ReservationsTab } from "@/components/reservations/ReservationsTab";
import { BudgetTab } from "@/components/budget/BudgetTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthGuard } from "@/components/auth/AuthGuard";

function TripPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const tripId = params.tripId as string;
  const queryClient = useQueryClient();

  const { data: trip, isLoading: isLoadingTrip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripService.getTrip(tripId),
    enabled: !!user && !!tripId,
  });

  const { data: tripDaysData, isLoading: isLoadingDays } = useQuery({
    queryKey: ["tripDays", tripId],
    queryFn: async () => {
      const fetchedDays = await tripService.getTripDays(tripId);
      const activitiesMap: Record<string, TripActivity[]> = {};
      await Promise.all(
        fetchedDays.map(async (day) => {
          const acts = await activityService.getActivitiesByDay(day.$id);
          activitiesMap[day.$id] = acts;
        })
      );
      return { days: fetchedDays, activitiesMap };
    },
    enabled: !!user && !!tripId,
  });

  const days = tripDaysData?.days || [];
  const activitiesMap = tripDaysData?.activitiesMap || {};

  const isLoading = isLoadingTrip || isLoadingDays || isAuthLoading;

  const [isAddingDay, setIsAddingDay] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("viewer");

  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [activeUsers, setActiveUsers] = useState<TripPresence[]>([]);
  const { setEditingStatus, setViewingStatus } = useTripPresence({
    tripId,
    user,
  });

  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<TripActivity | null>(
    null
  );
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [dayToRename, setDayToRename] = useState<TripDay | null>(null);
  const [activeDayMenuId, setActiveDayMenuId] = useState<string | null>(null);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);
  const [activeDayImageUpload, setActiveDayImageUpload] = useState<
    string | null
  >(null);
  const [activeActivityImageUpload, setActiveActivityImageUpload] = useState<
    string | null
  >(null);
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState("Itinerary");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement to start drag (allows clicking buttons inside cards)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadRoleAndPresenceData = useCallback(async () => {
    if (!user || !trip) return;
    try {
      // Create or backfill membership
      const ensuredMember = await memberService.ensureMembership(
        tripId,
        user.$id,
        trip.createdBy === user.$id ? "owner" : "viewer"
      );

      const members = await memberService.getTripMembers(tripId);
      let member =
        members.find((m) => m.userId === user.$id) || (ensuredMember as any);

      if (member) {
        setCurrentUserRole(member.role);

        if (member.role === "viewer") {
          const hasReq = await roleRequestService.checkPendingRequestExists(
            tripId,
            user.$id
          );
          setHasPendingRequest(hasReq);
        }
      }

      if (trip.createdBy === user.$id) {
        const reqs = await roleRequestService.getPendingRequestsForTrip(tripId);
        setPendingRequests(reqs);
      }

      const presence = await presenceService.getTripPresence(tripId);
      setActiveUsers(presence);
    } catch (error) {
      console.error("Error loading supplementary trip data:", error);
    }
  }, [tripId, user, trip]);

  useEffect(() => {
    if (user && trip) {
      loadRoleAndPresenceData();
    }
  }, [user, trip, loadRoleAndPresenceData]);

  // Prune stale presences locally (>30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setActiveUsers((prev) =>
        prev.filter((p) => {
          const lastSeen = new Date(p.lastSeen);
          return now.getTime() - lastSeen.getTime() < 30000;
        })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Listen for role request events from the central realtime pipeline
  useEffect(() => {
    const handleRoleRequest = (e: Event) => {
      const { event, tripId: eventTripId } = (e as CustomEvent).detail;
      if (eventTripId !== tripId) return;

      const payload = event.payload as any;
      const isCreate = event.events.some((ev: string) =>
        ev.includes(".create")
      );
      const isUpdate = event.events.some((ev: string) =>
        ev.includes(".update")
      );
      const isDelete = event.events.some((ev: string) =>
        ev.includes(".delete")
      );

      const request = payload as RoleRequest;
      if (isCreate && request.status === "pending") {
        if (trip && user && trip.createdBy === user.$id) {
          roleRequestService
            .getPendingRequestsForTrip(tripId)
            .then((reqs) => setPendingRequests(reqs));
          toast.info("New Editor Access Request received");
        }
      } else if (isUpdate || isDelete) {
        if (trip && user && trip.createdBy === user.$id) {
          if (request.status !== "pending" || isDelete) {
            setPendingRequests((prev) =>
              prev.filter((r) => r.$id !== request.$id)
            );
          }
        }
        if (
          user &&
          request.userId === user.$id &&
          (request.status !== "pending" || isDelete)
        ) {
          setHasPendingRequest(false);
        }
      }
    };

    window.addEventListener("realtime:roleRequests", handleRoleRequest);
    return () =>
      window.removeEventListener("realtime:roleRequests", handleRoleRequest);
  }, [tripId, user, trip]);

  // Listen for member events from the central realtime pipeline
  useEffect(() => {
    const handleMemberEvent = (e: Event) => {
      const { event, tripId: eventTripId } = (e as CustomEvent).detail;
      if (eventTripId !== tripId) return;

      const payload = event.payload as any;
      if (user && payload.userId === user.$id) {
        const isUpdate = event.events.some((ev: string) =>
          ev.includes(".update")
        );
        const isDelete = event.events.some((ev: string) =>
          ev.includes(".delete")
        );

        if (isUpdate) {
          setCurrentUserRole(payload.role);
          toast.success(`Your role was updated to ${payload.role}`);
        } else if (isDelete) {
          toast.error("You have been removed from this trip.");
          router.push("/dashboard");
        }
      }
    };

    window.addEventListener("realtime:members", handleMemberEvent);
    return () =>
      window.removeEventListener("realtime:members", handleMemberEvent);
  }, [tripId, user, router]);

  const handleAddDay = async () => {
    if (!trip) return;

    try {
      setIsAddingDay(true);

      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      const orderIndex = days.length;

      const newDate = addDays(startDate, orderIndex);

      if (!isBefore(newDate, addDays(endDate, 1))) {
        toast.error("Cannot add more days than the trip duration.");
        return;
      }

      const dateString = newDate.toISOString().split("T")[0];

      await tripService.addTripDay(tripId, dateString, orderIndex);
      queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
      toast.success("Day added successfully");
    } catch (error) {
      console.error("Error adding day:", error);
      toast.error("Failed to add day");
    } finally {
      setIsAddingDay(false);
    }
  };

  const handleCoverUploadComplete = async (fileId: string) => {
    try {
      if (!trip) return;
      await tripService.updateTrip(tripId, {
        coverImageId: fileId,
        coverImage: "",
      });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Cover image updated!");
    } catch (error) {
      toast.error("Failed to update cover image");
    }
  };

  const handleCoverUrlAdd = async (url: string) => {
    try {
      if (!trip) return;
      await tripService.updateTrip(tripId, {
        coverImage: url,
        coverImageId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Cover image updated!");
    } catch (error) {
      toast.error("Failed to update cover image");
    }
  };

  const handleDayCoverUploadComplete = async (fileId: string) => {
    if (!activeDayImageUpload) return;
    try {
      await tripService.updateTripDay(activeDayImageUpload, {
        coverImageId: fileId,
        coverImage: "",
      } as any);
      queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
      toast.success("Day cover updated!");
    } catch (error) {
      toast.error("Failed to update day cover");
    } finally {
      setActiveDayImageUpload(null);
    }
  };

  const handleDayCoverUrlAdd = async (url: string) => {
    if (!activeDayImageUpload) return;
    try {
      await tripService.updateTripDay(activeDayImageUpload, {
        coverImage: url,
        coverImageId: "",
      } as any);
      queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
      toast.success("Day cover updated!");
    } catch (error) {
      toast.error("Failed to update day cover");
    } finally {
      setActiveDayImageUpload(null);
    }
  };

  const handleActivityUploadComplete = async (fileId: string) => {
    if (!activeActivityImageUpload) return;
    try {
      let targetActivity: TripActivity | null = null;
      let targetDayId: string | null = null;
      for (const [dayId, acts] of Object.entries(activitiesMap)) {
        const found = acts.find((a) => a.$id === activeActivityImageUpload);
        if (found) {
          targetActivity = found;
          targetDayId = dayId;
          break;
        }
      }
      if (!targetActivity || !targetDayId) return;

      const newImageIds = [...(targetActivity.imageIds || []), fileId];
      await activityService.updateActivity(activeActivityImageUpload, {
        imageIds: newImageIds,
      } as any);

      queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
      toast.success("Image added to activity!");
    } catch (error) {
      toast.error("Failed to add image to activity");
    } finally {
      setActiveActivityImageUpload(null);
    }
  };

  const handleActivityUrlAdd = async (url: string) => {
    if (!activeActivityImageUpload) return;
    try {
      let targetActivity: TripActivity | null = null;
      let targetDayId: string | null = null;
      for (const [dayId, acts] of Object.entries(activitiesMap)) {
        const found = acts.find((a) => a.$id === activeActivityImageUpload);
        if (found) {
          targetActivity = found;
          targetDayId = dayId;
          break;
        }
      }
      if (!targetActivity || !targetDayId) return;

      const newImageUrls = [...(targetActivity.imageUrls || []), url];
      await activityService.updateActivity(activeActivityImageUpload, {
        imageUrls: newImageUrls,
      } as any);

      queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
      toast.success("Image added to activity!");
    } catch (error) {
      toast.error("Failed to add image to activity");
    } finally {
      setActiveActivityImageUpload(null);
    }
  };

  const handleDeleteTrip = () => {
    if (!trip || !user) return;

    if (trip.createdBy !== user.$id) {
      toast.error("Only the owner can delete this trip.");
      return;
    }

    toast("Delete this trip?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            setIsDeleting(true);
            await tripService.deleteTrip(tripId);
            toast.success("Trip deleted successfully");
            router.push("/dashboard");
          } catch (error) {
            console.error("Error deleting trip:", error);
            toast.error("Failed to delete trip");
            setIsDeleting(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleRequestEditorAccess = async () => {
    if (!user || hasPendingRequest) return;
    try {
      setIsSubmittingRequest(true);
      await roleRequestService.createRoleRequest(tripId, user.$id, "editor");
      setHasPendingRequest(true);
      toast.success("Editor access request sent!");
    } catch (error) {
      console.error("Error requesting role upgrade:", error);
      toast.error("Failed to send request.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleApproveRequest = async (request: RoleRequest) => {
    try {
      const members = await memberService.getTripMembers(tripId);
      const targetMember = members.find((m) => m.userId === request.userId);

      if (!targetMember) throw new Error("Member not found in trip.");

      await roleRequestService.approveRoleRequest(
        request.$id,
        targetMember.$id,
        "editor"
      );

      toast.success("User promoted to Editor");
      setPendingRequests((prev) => prev.filter((r) => r.$id !== request.$id));
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await roleRequestService.rejectRoleRequest(requestId);
      toast.success("Request rejected");
      setPendingRequests((prev) => prev.filter((r) => r.$id !== requestId));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request.");
    }
  };

  const handleActivityAdded = (dayId: string, activity: TripActivity) => {
    queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
  };

  const { mutate: reorderActivities } = useMutation({
    mutationFn: (updates: { id: string; orderIndex: number }[]) =>
      activityService.reorderActivities(updates),
    onMutate: async (updates) => {
      // Prevent outgoing refetches from overwriting optimistic data
      await queryClient.cancelQueries({ queryKey: ["tripDays", tripId] });

      const previousData = queryClient.getQueryData<{
        days: TripDay[];
        activitiesMap: Record<string, TripActivity[]>;
      }>(["tripDays", tripId]);

      if (previousData) {
        const newMap = { ...previousData.activitiesMap };
        // We know they belong to the same day from handleDragEnd
        const dayId =
          updates.length > 0
            ? previousData.days.find((d) =>
                newMap[d.$id]?.some((a) => a.$id === updates[0].id)
              )?.$id
            : null;

        if (dayId && newMap[dayId]) {
          const actsCopy = [...newMap[dayId]];
          updates.forEach((u) => {
            const idx = actsCopy.findIndex((a) => a.$id === u.id);
            if (idx !== -1)
              actsCopy[idx] = { ...actsCopy[idx], orderIndex: u.orderIndex };
          });
          actsCopy.sort((a, b) => a.orderIndex - b.orderIndex);
          newMap[dayId] = actsCopy;

          queryClient.setQueryData(["tripDays", tripId], {
            ...previousData,
            activitiesMap: newMap,
          });
        }
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["tripDays", tripId], context.previousData);
      }
      toast.error("Failed to save new order");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
    },
  });

  const handleDragEnd = (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activities = activitiesMap[dayId] || [];
      const oldIndex = activities.findIndex((a) => a.$id === active.id);
      const newIndex = activities.findIndex((a) => a.$id === over.id);

      const newActivities = arrayMove(activities, oldIndex, newIndex);

      const updates = newActivities.map((act, index) => ({
        id: act.$id,
        orderIndex: index,
      }));

      reorderActivities(updates);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-orange border-t-transparent" />
      </div>
    );
  }

  if (!trip) return null;

  const isOwner = user && trip.createdBy === user.$id;
  const isOwnerOrEditor = isOwner || currentUserRole === "editor";

  const tripLengthInDays =
    Math.round(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;
  const canAddMoreDays = days.length < tripLengthInDays;

  return (
    <div className="min-h-screen bg-background-dark font-[family-name:var(--font-geist-sans)]">
      <Nav />

      <main className="mx-auto max-w-[1000px] px-6 pb-12 pt-32">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Cover Image Banner */}
        <AnimatePresence mode="wait">
          {trip.coverImageId || trip.coverImage ? (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="group relative mb-6 h-[300px] w-full overflow-hidden rounded-2xl border border-white/5 bg-black/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  trip.coverImageId
                    ? mediaService.getImagePreview(trip.coverImageId)
                    : trip.coverImage!
                }
                alt="Trip Cover"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  console.error("Failed to load cover image:", {
                    coverImageId: trip.coverImageId,
                    coverImage: trip.coverImage,
                    src: e.currentTarget.src,
                  });
                }}
              />
              {isOwnerOrEditor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCoverImageModalOpen(true)}
                  className="absolute right-4 top-4 border-white/20 bg-black/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/70 hover:text-white group-hover:opacity-100"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Change Cover
                </Button>
              )}
            </motion.div>
          ) : (
            isOwnerOrEditor && (
              <motion.div
                key="add-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setIsCoverImageModalOpen(true)}
                  className="mb-8 w-full border-dashed border-white/20 bg-white/5 py-8 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Add Cover Image
                </Button>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="mb-12 flex flex-col justify-between gap-6 rounded-2xl border border-white/5 bg-card-dark p-8 shadow-sm sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {trip.title}
              </h1>
              {isOwnerOrEditor && (
                <button
                  onClick={() => setIsEditingTrip(true)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
            </div>
            {trip.description && (
              <p className="mb-4 text-gray-400">{trip.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300">
              <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                <Calendar className="h-4 w-4 text-accent-orange" />
                {format(new Date(trip.startDate), "MMMM d, yyyy")} -{" "}
                {format(new Date(trip.endDate), "MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                <MapPin className="h-4 w-4 text-accent-orange" />
                {tripLengthInDays} Days Total
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            <MemberList
              tripId={tripId}
              isOwner={isOwner!}
              activeUsers={activeUsers}
            />

            {isOwner && (
              <Button
                variant="outline"
                onClick={handleDeleteTrip}
                disabled={isDeleting}
                className="ml-4 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Trip
              </Button>
            )}
          </div>
        </div>

        {/* Viewer Upgrade UI */}
        {currentUserRole === "viewer" && (
          <div className="mb-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 sm:flex-row">
            <div>
              <p className="font-semibold text-white">Your role: Viewer</p>
              <p className="text-sm text-gray-400">
                You can currently only view this itinerary.
              </p>
            </div>
            <Button
              onClick={handleRequestEditorAccess}
              disabled={isSubmittingRequest || hasPendingRequest}
              className="w-full shrink-0 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
            >
              {isSubmittingRequest ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {hasPendingRequest
                ? "Editor Request Sent"
                : "Request Editor Access"}
            </Button>
          </div>
        )}

        {/* Owner Request Panel */}
        {isOwner && pendingRequests.length > 0 && (
          <div className="mb-12 rounded-2xl border border-accent-orange/20 bg-accent-orange/5 p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-orange text-xs text-white">
                {pendingRequests.length}
              </span>
              Access Requests
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.$id}
                  className="flex flex-col items-start justify-between gap-4 rounded-xl border border-white/5 bg-card-dark p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-orange/20 font-bold uppercase text-accent-orange">
                      {req.user?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {req.user?.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-400">
                        wants Editor access
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(req)}
                      className="flex-1 bg-accent-orange text-white hover:bg-orange-600 sm:flex-none"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(req.$id)}
                      className="flex-1 border-white/10 bg-transparent text-gray-300 hover:bg-white/5 sm:flex-none"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <div className="hide-scrollbar mb-8 flex overflow-x-auto border-b border-white/10 pb-px">
          {["Itinerary", "Checklist", "Reservations", "Files", "Budget"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-accent-orange text-accent-orange"
                    : "border-transparent text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "Itinerary" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Itinerary</h2>
                {activeUsers.length > 0 && (
                  <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-400">
                    {activeUsers.length} online
                  </span>
                )}
              </div>
              <Button
                onClick={handleAddDay}
                disabled={isAddingDay || !canAddMoreDays || !isOwnerOrEditor}
                className="bg-accent-orange text-white hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400"
              >
                {isAddingDay ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Day
              </Button>
            </div>

            {!canAddMoreDays && days.length > 0 && (
              <p className="mb-6 text-sm text-gray-400">
                All planned days have been added for this trip duration.
              </p>
            )}

            {days.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 p-12 text-center text-gray-400">
                <Calendar className="mb-4 h-8 w-8 text-white/20" />
                <p className="mb-2 text-white">No days planned yet</p>
                <p className="text-sm">
                  Click the Add Day button to start building your itinerary.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {days.map((day, idx) => {
                    const dayActivities = activitiesMap[day.$id] || [];

                    return (
                      <motion.div
                        key={day.$id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="group relative flex flex-col overflow-visible rounded-xl border border-white/5 bg-card-dark transition-all hover:border-accent-orange/30"
                      >
                        {/* Day Cover Image */}
                        <AnimatePresence>
                          {day.coverImageId || day.coverImage ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 200, opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="relative w-full overflow-hidden bg-black/20"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  day.coverImageId
                                    ? mediaService.getImagePreview(
                                        day.coverImageId
                                      )
                                    : day.coverImage!
                                }
                                alt={`Day ${idx + 1} Cover`}
                                className="h-full w-full object-cover"
                              />
                              {isOwnerOrEditor && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setActiveDayImageUpload(day.$id)
                                  }
                                  className="absolute right-4 top-4 border-white/20 bg-black/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/70 hover:text-white group-hover:opacity-100"
                                >
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  Change Cover
                                </Button>
                              )}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>

                        <div className="relative flex flex-col gap-4 overflow-visible p-6 sm:flex-row sm:items-start">
                          {/* Day Number Column with Timeline */}
                          <div className="relative flex flex-row items-center gap-4 overflow-visible sm:min-w-[100px] sm:flex-col sm:items-center">
                            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-dark text-lg font-bold text-accent-orange shadow-md ring-1 ring-white/10">
                              {idx + 1}
                            </div>

                            {/* Vertical Timeline Indicator */}
                            <motion.div
                              initial={{ height: 0 }}
                              whileInView={{ height: 1000 }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, ease: "circOut" }}
                              className="pointer-events-none absolute left-1/2 top-14 hidden w-px -translate-x-1/2 bg-gradient-to-b from-accent-orange/50 via-accent-orange/10 to-transparent sm:block"
                            />

                            <div className="mt-6 hidden h-[100px] items-center justify-center sm:flex">
                              <p className="-rotate-90 whitespace-nowrap text-sm font-medium text-gray-400">
                                {format(new Date(day.date), "MMM d, yyyy")}
                              </p>
                            </div>
                            <p className="mt-0 whitespace-nowrap text-sm font-medium text-gray-400 sm:hidden">
                              {format(new Date(day.date), "MMM d, yyyy")}
                            </p>
                          </div>

                          {/* Content Column */}
                          <div className="relative z-10 w-full">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-semibold text-white">
                                  {day.title || `Day ${idx + 1}`}
                                </h3>
                                {(() => {
                                  const editingUsers = activeUsers.filter(
                                    (u) =>
                                      u.status === "editing" &&
                                      u.editingDayId === day.$id &&
                                      u.userId !== user?.$id
                                  );
                                  if (editingUsers.length > 0) {
                                    return (
                                      <span className="animate-pulse text-xs font-medium text-accent-orange">
                                        {editingUsers
                                          .map((u) => u.userName.split(" ")[0])
                                          .join(", ")}{" "}
                                        {editingUsers.length > 1 ? "are" : "is"}{" "}
                                        editing...
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              {/* Day Options Menu */}
                              {isOwnerOrEditor && (
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setActiveDayMenuId(
                                        activeDayMenuId === day.$id
                                          ? null
                                          : day.$id
                                      )
                                    }
                                    className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                                  >
                                    <MoreVertical className="h-5 w-5" />
                                  </button>
                                  {activeDayMenuId === day.$id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setActiveDayMenuId(null)}
                                      />
                                      <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] py-1 shadow-lg">
                                        <button
                                          onClick={() => {
                                            setActiveDayMenuId(null);
                                            setDayToRename(day);
                                          }}
                                          className="flex w-full items-center px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                          <Edit2 className="mr-2 h-4 w-4" />{" "}
                                          Rename
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveDayMenuId(null);
                                            setActiveDayImageUpload(day.$id);
                                          }}
                                          className="flex w-full items-center px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                          <ImageIcon className="mr-2 h-4 w-4" />{" "}
                                          Add Cover Image
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveDayMenuId(null);
                                            toast("Delete this day?", {
                                              description:
                                                "Activities within it will be orphaned or deleted.",
                                              action: {
                                                label: "Delete",
                                                onClick: async () => {
                                                  try {
                                                    await tripService.deleteTripDay(
                                                      day.$id
                                                    );
                                                  } catch (error) {
                                                    toast.error(
                                                      "Failed to delete day."
                                                    );
                                                  }
                                                },
                                              },
                                              cancel: {
                                                label: "Cancel",
                                                onClick: () => {},
                                              },
                                            });
                                          }}
                                          className="flex w-full items-center px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                                          Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Activities DnD Context */}
                            <div className="space-y-3">
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={() => setEditingStatus(day.$id)}
                                onDragEnd={(event) => {
                                  handleDragEnd(event, day.$id);
                                  setViewingStatus();
                                }}
                                onDragCancel={() => setViewingStatus()}
                                modifiers={[restrictToVerticalAxis]}
                              >
                                <SortableContext
                                  items={dayActivities.map((a) => a.$id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {dayActivities.map((activity) => (
                                    <ActivityCard
                                      key={activity.$id}
                                      activity={activity}
                                      isOwnerOrEditor={isOwnerOrEditor}
                                      onAddImage={() =>
                                        setActiveActivityImageUpload(
                                          activity.$id
                                        )
                                      }
                                      onImageClick={(images, index) =>
                                        setLightboxData({ images, index })
                                      }
                                      onDeleteImage={async (imageIndex) => {
                                        const imageIdsArr =
                                          activity.imageIds || [];
                                        const imageUrlsArr =
                                          activity.imageUrls || [];

                                        if (imageIndex < imageIdsArr.length) {
                                          const fileId =
                                            imageIdsArr[imageIndex];
                                          const newIds = imageIdsArr.filter(
                                            (_, i) => i !== imageIndex
                                          );
                                          try {
                                            await mediaService.deleteImage(
                                              fileId
                                            );
                                            await activityService.updateActivity(
                                              activity.$id,
                                              { imageIds: newIds } as any
                                            );
                                            queryClient.invalidateQueries({
                                              queryKey: ["tripDays", tripId],
                                            });
                                            toast.success("Image removed");
                                          } catch {
                                            toast.error(
                                              "Failed to delete image"
                                            );
                                          }
                                        } else {
                                          const urlIndex =
                                            imageIndex - imageIdsArr.length;
                                          const newUrls = imageUrlsArr.filter(
                                            (_, i) => i !== urlIndex
                                          );
                                          try {
                                            await activityService.updateActivity(
                                              activity.$id,
                                              { imageUrls: newUrls } as any
                                            );
                                            queryClient.invalidateQueries({
                                              queryKey: ["tripDays", tripId],
                                            });
                                            toast.success("Image removed");
                                          } catch {
                                            toast.error(
                                              "Failed to delete image"
                                            );
                                          }
                                        }
                                      }}
                                      onEdit={() => {
                                        setActivityToEdit(activity);
                                        setActiveDayId(day.$id);
                                      }}
                                      onDelete={() => {
                                        toast("Delete this activity?", {
                                          description:
                                            "Are you sure you want to delete this activity?",
                                          action: {
                                            label: "Delete",
                                            onClick: async () => {
                                              try {
                                                await activityService.deleteActivity(
                                                  activity.$id
                                                );
                                              } catch (error) {
                                                toast.error(
                                                  "Failed to delete activity."
                                                );
                                              }
                                            },
                                          },
                                          cancel: {
                                            label: "Cancel",
                                            onClick: () => {},
                                          },
                                        });
                                      }}
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>
                            </div>

                            {/* Add Activity Button */}
                            {isOwnerOrEditor && (
                              <button
                                onClick={() => {
                                  setActiveDayId(day.$id);
                                  setEditingStatus(day.$id);
                                }}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 p-4 text-sm text-gray-500 transition-colors hover:border-accent-orange/50 hover:bg-accent-orange/5 hover:text-accent-orange"
                              >
                                <Plus className="h-4 w-4" /> Add Activity
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {activeTab === "Checklist" && (
          <ChecklistTab
            tripId={tripId}
            isOwnerOrEditor={isOwnerOrEditor}
            userId={user?.$id}
          />
        )}

        {activeTab === "Files" && (
          <FilesTab
            tripId={tripId}
            isOwnerOrEditor={isOwnerOrEditor}
            userId={user?.$id}
          />
        )}

        {activeTab === "Reservations" && (
          <ReservationsTab
            tripId={tripId}
            isOwnerOrEditor={isOwnerOrEditor}
            userId={user?.$id}
          />
        )}

        {activeTab === "Budget" && (
          <ErrorBoundary>
            <BudgetTab
              trip={trip}
              currentUserId={user?.$id || ""}
              isOwnerOrEditor={isOwnerOrEditor}
            />
          </ErrorBoundary>
        )}
      </main>

      <ImageUploadModal
        isOpen={isCoverImageModalOpen}
        onClose={() => setIsCoverImageModalOpen(false)}
        onUploadComplete={handleCoverUploadComplete}
        onUrlAdd={handleCoverUrlAdd}
        title="Set Trip Cover Image"
      />

      <ImageUploadModal
        isOpen={!!activeDayImageUpload}
        onClose={() => setActiveDayImageUpload(null)}
        onUploadComplete={handleDayCoverUploadComplete}
        onUrlAdd={handleDayCoverUrlAdd}
        title="Set Day Cover Image"
      />

      <ImageUploadModal
        isOpen={!!activeActivityImageUpload}
        onClose={() => setActiveActivityImageUpload(null)}
        onUploadComplete={handleActivityUploadComplete}
        onUrlAdd={handleActivityUrlAdd}
        title="Add Image to Activity"
      />

      {lightboxData && (
        <ImageLightbox
          images={lightboxData.images}
          initialIndex={lightboxData.index}
          isOpen={!!lightboxData}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* Edit Trip Modal */}
      {isEditingTrip && trip && (
        <EditTripModal
          isOpen={true}
          onClose={() => setIsEditingTrip(false)}
          trip={trip}
          onUpdate={(t) => {
            queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
          }}
        />
      )}

      {/* Rename Day Modal */}
      {dayToRename && (
        <RenameDayModal
          isOpen={true}
          onClose={() => setDayToRename(null)}
          day={dayToRename}
          onUpdate={(d) => {
            queryClient.invalidateQueries({ queryKey: ["tripDays", tripId] });
          }}
        />
      )}

      {/* Add/Edit Activity Modal */}
      {activeDayId && user && (
        <AddActivityModal
          isOpen={true}
          onClose={() => {
            setActiveDayId(null);
            setActivityToEdit(null);
            setViewingStatus();
          }}
          dayId={activeDayId}
          tripId={tripId}
          userId={user.$id}
          activityToEdit={activityToEdit}
          currentActivityCount={(activitiesMap[activeDayId] || []).length}
          onActivityAdded={(activity) =>
            handleActivityAdded(activeDayId, activity)
          }
        />
      )}
    </div>
  );
}

export default function TripPage() {
  return (
    <AuthGuard>
      <TripPageContent />
    </AuthGuard>
  );
}
