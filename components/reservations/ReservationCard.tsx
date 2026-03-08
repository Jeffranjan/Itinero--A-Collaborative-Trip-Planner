import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Hotel,
  Train,
  Car,
  Activity,
  Utensils,
  MapPin,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Hash,
} from "lucide-react";
import { TripReservation, ReservationType } from "@/types/reservation";

interface ReservationCardProps {
  reservation: TripReservation;
  isOwnerOrEditor: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const TYPE_ICONS: Record<ReservationType, React.FC<any>> = {
  flight: Plane,
  hotel: Hotel,
  train: Train,
  car: Car,
  activity: Activity,
  restaurant: Utensils,
  other: MapPin,
};

export function ReservationCard({
  reservation,
  isOwnerOrEditor,
  onEdit,
  onDelete,
}: ReservationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const Icon = TYPE_ICONS[reservation.type] || TYPE_ICONS.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="group relative flex flex-col gap-4 rounded-xl border border-white/5 bg-card-dark p-6 transition-all hover:border-accent-orange/30 sm:flex-row sm:items-start"
    >
      {/* Icon Area */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent-orange/20 bg-accent-orange/10 text-accent-orange">
        <Icon className="h-6 w-6" />
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {reservation.title}
            </h3>
            <p className="mt-1 inline-block text-sm font-medium uppercase tracking-wider text-accent-orange/70">
              {reservation.type}
            </p>
          </div>

          {/* Menu */}
          {isOwnerOrEditor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] py-1 shadow-xl"
                    >
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit();
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {reservation.startDate && (
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="mr-2 h-4 w-4 shrink-0 text-white/40" />
              <span>
                {format(new Date(reservation.startDate), "MMM d, yyyy h:mm a")}
                {reservation.endDate &&
                  ` - ${format(
                    new Date(reservation.endDate),
                    "MMM d, yyyy h:mm a"
                  )}`}
              </span>
            </div>
          )}

          {reservation.location && (
            <div className="flex items-center text-sm text-gray-400">
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-white/40" />
              <span className="truncate">{reservation.location}</span>
            </div>
          )}

          {reservation.reservationNumber && (
            <div className="flex items-center text-sm text-gray-400">
              <Hash className="mr-2 h-4 w-4 shrink-0 text-white/40" />
              <span className="font-mono">{reservation.reservationNumber}</span>
            </div>
          )}
        </div>

        {reservation.notes && (
          <div className="relative mt-4 rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-gray-300 shadow-inner">
            {reservation.notes}
          </div>
        )}
      </div>
    </motion.div>
  );
}
