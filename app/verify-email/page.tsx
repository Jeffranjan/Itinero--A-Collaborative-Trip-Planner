"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!userId || !secret) {
      setStatus("error");
      setErrorMessage("Missing verification parameters.");
      return;
    }

    const verifyEmail = async () => {
      try {
        await account.updateVerification(userId, secret);
        setStatus("success");
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } catch (error: any) {
        console.error("Verification failed:", error);
        setStatus("error");
        setErrorMessage(
          error?.message || "Verification link expired or invalid."
        );
      }
    };

    verifyEmail();
  }, [userId, secret, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark px-4 font-[family-name:var(--font-geist-sans)]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card-dark p-8 text-center shadow-2xl"
      >
        <Link
          href="/"
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-orange to-orange-400 text-3xl font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        >
          T
        </Link>
        <h1 className="mb-2 text-2xl font-bold text-white">
          Email Verification
        </h1>

        <div className="mt-8 flex flex-col items-center justify-center space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-accent-orange" />
              <p className="text-gray-400">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center space-y-4"
            >
              <CheckCircle className="h-16 w-16 rounded-full text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
              <p className="font-medium text-green-400">
                Email verified successfully!
              </p>
              <p className="text-sm text-gray-400">Redirecting to login...</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex w-full flex-col items-center space-y-4"
            >
              <XCircle className="h-16 w-16 rounded-full text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
              <p className="text-center font-medium text-red-400">
                {errorMessage}
              </p>

              <div className="mt-6 w-full space-y-3">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Go to login to resend
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background-dark">
          <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
