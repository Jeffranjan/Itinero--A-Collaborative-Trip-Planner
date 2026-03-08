"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ID, Permission, Role } from "appwrite";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { account, databases } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const verified = searchParams.get("verified");

  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (verified === "true") {
      // If we are already verified and have a session, just go to dashboard
      if (!isAuthLoading && user?.emailVerification) {
        router.replace(redirectUrl);
        return;
      }
      toast.success("Email verified successfully. You can now log in.");
      router.replace("/login");
    }
  }, [verified, router, user, isAuthLoading, redirectUrl]);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const currentUser = await account.get();
        if (currentUser.emailVerification === true) {
          router.replace(redirectUrl);
        } else if (currentUser.emailVerification === false) {
          router.replace("/verify-notice");
        }
      } catch {
        // No session exists
      }
    };
    checkExistingSession();
  }, [router, redirectUrl]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLoginSessionCreation = async () => {
    try {
      // 1. Try to get current session. If it succeeds, we have an active session
      // that is blocking the new login attempt.
      await account.get();
      // 2. Clear it proactively.
      await account.deleteSession("current");
    } catch {
      // No active session exists, which is fine
    }

    // 3. Now it is safe to create the new session
    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error: any) {
      if (
        error?.message?.includes(
          "Creation of a session is prohibited when a session is active"
        )
      ) {
        // Fallback retry if the race condition wasn't caught
        await account.deleteSession("current");
        await account.createEmailPasswordSession(email, password);
      } else {
        throw error;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);
      if (isLogin) {
        await handleLoginSessionCreation();

        const currentUser = await account.get();

        if (!currentUser.emailVerification) {
          router.replace("/verify-notice");
          return;
        }

        toast.success("Logged in successfully!");
        router.replace(redirectUrl);
        return;
      } else {
        const newUser = await account.create(
          ID.unique(),
          email,
          password,
          name
        );

        // Temporarily log in to trigger verification email
        await handleLoginSessionCreation();
        await account.createVerification(
          `${window.location.origin}/verify-email`
        );
        try {
          await account.deleteSession("current");
        } catch (delErr) {
          console.error("Failed to delete temp session cleanly", delErr);
        }

        // Add to users collection for directory lookups
        try {
          await databases.createDocument(
            DATABASE_ID,
            "users",
            newUser.$id,
            { email: newUser.email.toLowerCase(), name: newUser.name },
            [
              Permission.read(Role.any()), // Allow anyone to search by email for invites
              Permission.update(Role.user(newUser.$id)),
              Permission.delete(Role.user(newUser.$id)),
            ]
          );
        } catch (dbErr) {
          console.error("Failed to add user to directory", dbErr);
        }

        toast.success("Account created! Please verify your email.");
        router.replace("/verify-notice");
        return;
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error?.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark px-4 font-[family-name:var(--font-geist-sans)]">
      {/* Background Effect */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card-dark p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-orange to-orange-400 text-2xl font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]"
          >
            T
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {isLogin
              ? "Enter your details to access your trips"
              : "Sign up to start planning collaborative trips"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-colors focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full bg-accent-orange py-6 text-base text-white hover:bg-orange-600"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-accent-orange transition-colors hover:text-orange-400"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background-dark">
          <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
