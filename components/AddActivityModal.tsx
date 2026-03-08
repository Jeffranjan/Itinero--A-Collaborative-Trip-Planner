"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { activityService } from "@/services/activity.service";
import { TripActivity } from "@/types/trip";
import { Button } from "@/components/ui/Button";
import { ModalWrapper } from "@/components/ui/ModalWrapper";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayId: string;
  tripId: string;
  userId: string;
  currentActivityCount: number;
  onActivityAdded: (activity: TripActivity) => void;
  activityToEdit?: TripActivity | null;
}

export function AddActivityModal({
  isOpen,
  onClose,
  dayId,
  tripId,
  userId,
  currentActivityCount,
  onActivityAdded,
  activityToEdit,
}: AddActivityModalProps) {
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
      location: "",
      startTime: "",
      endTime: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (activityToEdit) {
        reset({
          title: activityToEdit.title,
          description: activityToEdit.description || "",
          location: activityToEdit.location || "",
          startTime: activityToEdit.startTime || "",
          endTime: activityToEdit.endTime || "",
        });
      } else {
        reset({
          title: "",
          description: "",
          location: "",
          startTime: "",
          endTime: "",
        });
      }
    }
  }, [isOpen, activityToEdit, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      if (activityToEdit) {
        const updatedActivity = await activityService.updateActivity(
          activityToEdit.$id,
          data
        );
        toast.success("Activity updated successfully!");
        onActivityAdded(updatedActivity);
      } else {
        const newActivity = await activityService.createActivity(
          {
            ...data,
            dayId,
            tripId,
            orderIndex: currentActivityCount,
          },
          userId
        );
        toast.success("Activity added successfully!");
        onActivityAdded(newActivity);
      }
      onClose();
    } catch (error) {
      toast.error(
        `Failed to ${activityToEdit ? "update" : "add"} activity. Please try again.`
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={activityToEdit ? "Edit Activity" : "Add Activity"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Title *
          </label>
          <input
            {...register("title")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
            placeholder="e.g. Visit Eiffel Tower"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Location
          </label>
          <input
            {...register("location")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
            placeholder="e.g. Champ de Mars, Paris"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            {...register("description")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
            placeholder="Notes, booking references, etc."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Start Time
            </label>
            <input
              type="time"
              {...register("startTime")}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              End Time
            </label>
            <input
              type="time"
              {...register("endTime")}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
            />
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
            ) : activityToEdit ? (
              "Save Changes"
            ) : (
              "Add Activity"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
