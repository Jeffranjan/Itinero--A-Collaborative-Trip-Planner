"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { tripService } from "@/services/trip.service";
import { Button } from "@/components/ui/button";
import { Trip } from "@/types/trip";

const formSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof formSchema>;

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onUpdate: (updatedTrip: Trip) => void;
}

export function EditTripModal({
  isOpen,
  onClose,
  trip,
  onUpdate,
}: EditTripModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (isOpen && trip) {
      reset({
        title: trip.title,
        description: trip.description || "",
        startDate: new Date(trip.startDate).toISOString().split("T")[0],
        endDate: new Date(trip.endDate).toISOString().split("T")[0],
      });
    }
  }, [isOpen, trip, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const updatedTrip = await tripService.updateTrip(trip.$id, data);
      toast.success("Trip updated successfully!");
      onUpdate(updatedTrip);
      onClose();
    } catch (error: any) {
      toast.error(
        `Failed to update trip: ${error?.message || "Please try again."}`
      );
      console.error(error);
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Edit Trip</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Trip Title
                </label>
                <input
                  {...register("title")}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
                  placeholder="e.g. Summer in Paris"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Description <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
                  placeholder="What's this trip about?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register("startDate")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-32 bg-accent-orange text-white hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
