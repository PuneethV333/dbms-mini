"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "./AppLayout";
import { FullPageLoader } from "./FullPageLoader";

/**
 * Client-side guard for the app shell. Middleware already blocks anonymous page
 * requests; this keeps the UI correct during client navigation and blocks
 * non-admins from the admin screen before any admin query runs.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const adminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (adminRoute && !user.isAdmin) router.replace("/");
  }, [initializing, user, adminRoute, router]);

  if (initializing) return <FullPageLoader label="RESTORING SESSION…" />;
  if (!user) return <FullPageLoader label="RESTORING SESSION…" />;
  if (adminRoute && !user.isAdmin) return <FullPageLoader label="CHECKING ACCESS…" />;

  return <AppLayout>{children}</AppLayout>;
}
