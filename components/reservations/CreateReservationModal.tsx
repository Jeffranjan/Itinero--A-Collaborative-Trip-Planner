import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
  Hash,
  AlignLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { reservationService } from "@/services/reservation.service";
import { TripReservation, ReservationType } from "@/types/reservation";

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  userId: string;
  tripEditors: string[];
  tripMembers: string[];
  reservationToEdit?: TripReservation | null;
}

const RESERVATION_TYPES: { value: ReservationType; label: string }[] = [
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "train", label: "Train" },
  { value: "car", label: "Car Rental" },
  { value: "activity", label: "Activity" },
  { value: "restaurant", label: "Restaurant" },
  { value: "other", label: "Other" },
];

export function CreateReservationModal({
  isOpen,
  onClose,
  tripId,
  userId,
  tripEditors,
  tripMembers,
  reservationToEdit,
}: CreateReservationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "flight" as ReservationType,
    title: "",
    location: "",
    reservationNumber: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    if (reservationToEdit) {
      setFormData({
        type: reservationToEdit.type,
        title: reservationToEdit.title,
        location: reservationToEdit.location || "",
        reservationNumber: reservationToEdit.reservationNumber || "",
        startDate: reservationToEdit.startDate
          ? new Date(reservationToEdit.startDate).toISOString().slice(0, 16)
          : "",
        endDate: reservationToEdit.endDate
          ? new Date(reservationToEdit.endDate).toISOString().slice(0, 16)
          : "",
        notes: reservationToEdit.notes || "",
      });
    } else {
      setFormData({
        type: "flight",
        title: "",
        location: "",
        reservationNumber: "",
        startDate: "",
        endDate: "",
        notes: "",
      });
    }
  }, [reservationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please provide a title for the reservation.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: any = {
        type: formData.type,
        title: formData.title,
        location: formData.location || undefined,
        reservationNumber: formData.reservationNumber || undefined,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        notes: formData.notes || undefined,
        createdBy: userId, // ignored on update
      };

      if (reservationToEdit) {
        await reservationService.updateReservation(
          reservationToEdit.$id,
          payload
        );
        toast.success("Reservation updated successfully!");
      } else {
        await reservationService.createReservation(
          tripId,
          payload,
          userId,
          tripEditors,
          tripMembers
        );
        toast.success("Reservation added successfully!");
      }

      onClose();
    } catch (error) {
      console.error("Failed to save reservation:", error);
      toast.error(
        reservationToEdit
          ? "Failed to update reservation"
          : "Failed to add reservation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-card-dark shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {reservationToEdit ? "Edit Reservation" : "Add Reservation"}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {reservationToEdit
                      ? "Update the details of your booking."
                      : "Keep track of your travel confirmations."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="type"
                      className="text-sm font-medium leading-none text-white"
                    >
                      Reservation Type
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as ReservationType,
                        })
                      }
                      className="w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange"
                    >
                      {RESERVATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="title"
                      className="text-sm font-medium leading-none text-white"
                    >
                      Title *
                    </label>
                    <input
                      id="title"
                      placeholder="e.g. Delta Flight DL123"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="flex h-10 w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-orange"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="location"
                        className="flex items-center gap-2 text-sm font-medium leading-none text-white"
                      >
                        <MapPin className="h-3 w-3" /> Location
                      </label>
                      <input
                        id="location"
                        placeholder="e.g. JFK Airport"
                        value={formData.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="resNumber"
                        className="flex items-center gap-2 text-sm font-medium leading-none text-white"
                      >
                        <Hash className="h-3 w-3" /> Conf #
                      </label>
                      <input
                        id="resNumber"
                        placeholder="e.g. AB1234C"
                        value={formData.reservationNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            reservationNumber: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-orange"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="startDate"
                        className="flex items-center gap-2 text-sm font-medium leading-none text-white"
                      >
                        <CalendarIcon className="h-3 w-3" /> Start Date
                      </label>
                      <input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="endDate"
                        className="flex items-center gap-2 text-sm font-medium leading-none text-white"
                      >
                        <CalendarIcon className="h-3 w-3" /> End Date
                      </label>
                      <input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent-orange"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="notes"
                      className="flex items-center gap-2 text-sm font-medium leading-none text-white"
                    >
                      <AlignLeft className="h-3 w-3" /> Notes
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Add any extra details, terminal info, instructions..."
                      value={formData.notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-background-dark px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-orange"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-white/5 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="bg-accent-orange text-white hover:bg-orange-600"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {reservationToEdit ? "Save Changes" : "Add Reservation"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
