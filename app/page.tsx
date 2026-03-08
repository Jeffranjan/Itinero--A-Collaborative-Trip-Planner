"use client";

import { Nav } from "@/components/Nav";
import { Hero } from "@/components/home/Hero";
import { AdvancedFeatures } from "@/components/home/AdvancedFeatures";
import { InteractivePreview } from "@/components/home/InteractivePreview";
import { WorkflowTimeline } from "@/components/home/WorkflowTimeline";
import { motion } from "framer-motion";
import {
  Users,
  ListTodo,
  Navigation,
  Move,
  CalendarCheck,
  FileText,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#0D0D0D] font-[family-name:var(--font-geist-sans)] selection:bg-accent-orange/30">
      <Nav />

      <main className="flex-1">
        <Hero />

        {/* Features Section */}
        <section
          id="features"
          className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-24 sm:py-32"
        >
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Everything you need to plan the perfect trip
            </h2>
            <p className="mx-auto max-w-[600px] text-lg text-gray-400">
              Powerful tools designed to simplify group travel planning from
              start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Smart Itinerary",
                desc: "Organize your trips into clear, day-by-day schedules visually.",
                icon: <Navigation className="h-6 w-6 text-accent-orange" />,
              },
              {
                title: "Real-Time Collaboration",
                desc: "Invite friends and plan together live with instant updates.",
                icon: <Users className="h-6 w-6 text-blue-500" />,
              },
              {
                title: "Drag-and-Drop Planning",
                desc: "Easily reorder activities and days to perfect your schedule.",
                icon: <Move className="h-6 w-6 text-green-500" />,
              },
              {
                title: "Group Checklists",
                desc: "Keep track of packing lists and tasks for everyone.",
                icon: <ListTodo className="h-6 w-6 text-yellow-500" />,
              },
              {
                title: "Reservations Manager",
                desc: "Store flights, hotels, and bookings all in one place.",
                icon: <CalendarCheck className="h-6 w-6 text-purple-500" />,
              },
              {
                title: "Trip Documents Storage",
                desc: "Upload and access important PDFs and tickets anytime.",
                icon: <FileText className="h-6 w-6 text-pink-500" />,
              },
              {
                title: "Expense Splitting",
                desc: "Track group costs and split payments effortlessly.",
                icon: <Wallet className="h-6 w-6 text-emerald-400" />,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                className="group relative rounded-2xl border border-white/10 bg-[#161616]/50 p-8 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-white/5 bg-[#1A1A1A] transition-colors duration-300 group-hover:bg-white/5">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <AdvancedFeatures />

        <InteractivePreview />

        <WorkflowTimeline />

        {/* Final CTA Section */}
        <section className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-24 text-center sm:py-32">
          <div className="relative overflow-hidden rounded-[2rem] border border-accent-orange/20 bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] px-6 py-20 sm:py-24">
            {/* Animated Glow */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-orange/30 via-transparent to-transparent opacity-50"
            />

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="pointer-events-none absolute h-2 w-2 rounded-full bg-accent-orange/40"
                animate={{
                  y: [0, -40, 0],
                  x: [0, i % 2 === 0 ? 20 : -20, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                style={{
                  left: `${10 + i * 11}%`,
                  top: `${20 + (i % 3) * 20}%`,
                }}
              />
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                Start building your
                <br className="hidden sm:block" /> next trip today.
              </h2>
              <p className="mx-auto mb-10 max-w-[600px] text-lg text-gray-400">
                Join thousands of travelers who plan their adventures together.
                Free to get started.
              </p>

              <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-full bg-accent-orange px-10 text-lg font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]"
                >
                  <Link href="/dashboard">Create Your First Trip</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center">
        <p className="text-sm text-gray-500">
          © 2026 Itinero. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
