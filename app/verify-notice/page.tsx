"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function VerifyNoticePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // If they somehow got here but are verified, send them to dashboard
  useEffect(() => {
    if (!isAuthLoading && user?.emailVerification) {
      router.push("/dashboard");
    }
  }, [user, isAuthLoading, router]);

  const handleResend = async () => {
    if (!user) {
      toast.error("You must be logged in to resend the verification email.");
      router.push("/login");
      return;
    }

    try {
      setIsResending(true);
      await account.createVerification(
        `${window.location.origin}/verify-email`
      );
      toast.success("Verification email sent!");
    } catch (error: any) {
      console.error("Failed to resend:", error);
      toast.error(error?.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark px-4 font-[family-name:var(--font-geist-sans)]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card-dark p-8 text-center shadow-2xl"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent-orange">
          <Mail className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">Check your inbox</h1>

        {!user ? (
          <>
            <p className="mb-8 text-gray-400">
              Your email address has not been verified. Please log in to resend
              the verification email.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-accent-orange py-6 font-medium text-white hover:bg-orange-600"
            >
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <p className="mb-8 text-gray-400">
              We need to verify your email address (
              <strong>{user.email}</strong>) to keep your account secure. Please
              check your inbox for the verification link.
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleResend}
                disabled={isResending}
                className="w-full bg-accent-orange py-6 font-medium text-white hover:bg-orange-600"
              >
                {isResending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Resend Verification Email"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
