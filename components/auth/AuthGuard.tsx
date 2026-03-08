"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setIsRedirecting(true);
        const fullUrl = searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
        router.replace(`/login?redirect=${encodeURIComponent(fullUrl)}`);
      } else if (user.emailVerification === false) {
        if (pathname !== "/verify-notice" && pathname !== "/verify-email") {
          setIsRedirecting(true);
          router.replace("/verify-notice");
        }
      }
    }
  }, [user, isLoading, router, pathname, searchParams]);

  if (isLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    );
  }

  // Double check before rendering children
  if (!user) return null;
  if (
    user.emailVerification === false &&
    pathname !== "/verify-notice" &&
    pathname !== "/verify-email"
  ) {
    return null;
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background-dark">
          <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
        </div>
      }
    >
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
}
