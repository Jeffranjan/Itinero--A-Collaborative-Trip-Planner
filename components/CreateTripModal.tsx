"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { tripService } from "@/services/trip.service";
import { Button } from "@/components/ui/button";
import { ModalWrapper } from "@/components/ui/ModalWrapper";

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

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function CreateTripModal({
  isOpen,
  onClose,
  userId,
}: CreateTripModalProps) {
  const router = useRouter();
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
    if (isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const newTrip = await tripService.createTrip(data, userId);
      toast.success("Trip created successfully!");
      onClose();
      router.push(`/trip/${newTrip.$id}`);
    } catch (error: any) {
      toast.error(
        `Failed to create trip: ${error?.message || "Please try again."}`
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create New Trip">
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
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
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
              "Create Trip"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
