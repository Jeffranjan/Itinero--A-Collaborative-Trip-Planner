import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

import { reservationService } from "@/services/reservation.service";
import { memberService } from "@/services/member.service";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { TripReservation } from "@/types/reservation";

import { Button } from "@/components/ui/button";
import { ReservationCard } from "@/components/reservations/ReservationCard";
import { CreateReservationModal } from "@/components/reservations/CreateReservationModal";

interface ReservationsTabProps {
  tripId: string;
  isOwnerOrEditor: boolean;
  userId?: string;
}

export function ReservationsTab({
  tripId,
  isOwnerOrEditor,
  userId,
}: ReservationsTabProps) {
  const [reservations, setReservations] = useState<TripReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationToEdit, setReservationToEdit] =
    useState<TripReservation | null>(null);

  // Members tracking for permissions
  const [tripEditors, setTripEditors] = useState<string[]>([]);
  const [tripMembers, setTripMembers] = useState<string[]>([]);

  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await reservationService.getTripReservations(tripId);
      setReservations(data);
    } catch (error) {
      console.error("Failed to load reservations", error);
      toast.error("Could not load reservations");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  const fetchMembers = useCallback(async () => {
    try {
      const members = await memberService.getTripMembers(tripId);
      const editors = members
        .filter((m) => m.role === "editor")
        .map((m) => m.userId);
      const viewers = members.map((m) => m.userId); // all members are readers natively
      setTripEditors(editors);
      setTripMembers(viewers);
    } catch (error) {
      console.error("Failed to load members for permissions", error);
    }
  }, [tripId]);

  useEffect(() => {
    fetchReservations();
    fetchMembers();
  }, [fetchReservations, fetchMembers]);

  const handleDelete = (id: string) => {
    toast("Delete Reservation?", {
      description: "Are you sure you want to remove this reservation?",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await reservationService.deleteReservation(id);
            // Realtime will remove it from the list
          } catch (error) {
            toast.error("Failed to delete reservation.");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const channels = useMemo(
    () => [
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_reservations.documents`,
    ],
    []
  );

  useRealtimeSubscription(
    channels,
    useCallback(
      (event) => {
        const payload = event.payload as TripReservation;
        if (payload.tripId !== tripId) return;

        const isCreate = event.events.some((e: string) =>
          e.includes(".create")
        );
        const isUpdate = event.events.some((e: string) =>
          e.includes(".update")
        );
        const isDelete = event.events.some((e: string) =>
          e.includes(".delete")
        );

        if (isCreate) {
          setReservations((prev) => {
            if (prev.some((r) => r.$id === payload.$id)) return prev;
            return [...prev, payload].sort(
              (a, b) =>
                new Date(a.startDate || a.createdAt).getTime() -
                new Date(b.startDate || b.createdAt).getTime()
            );
          });
        } else if (isUpdate) {
          setReservations((prev) =>
            prev
              .map((r) => (r.$id === payload.$id ? payload : r))
              .sort(
                (a, b) =>
                  new Date(a.startDate || a.createdAt).getTime() -
                  new Date(b.startDate || b.createdAt).getTime()
              )
          );
        } else if (isDelete) {
          setReservations((prev) => prev.filter((r) => r.$id !== payload.$id));
        }
      },
      [tripId]
    )
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reservations</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage your flights, hotels, set bookings, etc.
          </p>
        </div>
        {isOwnerOrEditor && (
          <Button
            onClick={() => {
              setReservationToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-accent-orange text-white hover:bg-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Reservation
          </Button>
        )}
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-black/10 py-24 text-center text-gray-500">
          <Calendar className="mb-4 h-10 w-10 text-white/20" />
          <p className="mb-2 text-white">No reservations yet</p>
          <p className="text-sm">
            Click the Add Reservation button to record bookings.
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <AnimatePresence>
            {reservations.map((res) => (
              <ReservationCard
                key={res.$id}
                reservation={res}
                isOwnerOrEditor={isOwnerOrEditor}
                onEdit={() => {
                  setReservationToEdit(res);
                  setIsModalOpen(true);
                }}
                onDelete={() => handleDelete(res.$id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Modal */}
      {userId && isOwnerOrEditor && (
        <CreateReservationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setReservationToEdit(null);
          }}
          tripId={tripId}
          userId={userId}
          tripEditors={tripEditors}
          tripMembers={tripMembers}
          reservationToEdit={reservationToEdit}
        />
      )}
    </div>
  );
}
