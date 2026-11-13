"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useContacts } from "@/lib/client/contacts";
import { useProfile } from "@/lib/client/users";
import { useAuth } from "@/lib/auth-context";
import {
  BeaconIcon,
  LogOutIcon,
  ShieldIcon,
  SosMark,
  UserIcon,
  UsersIcon,
} from "./icons";

function isActivePath(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function navClass(active: boolean): string {
  return [
    "flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-raised text-chalk shadow-[inset_2px_0_0_var(--color-signal)]"
      : "text-mist hover:bg-raised/60 hover:text-chalk",
  ].join(" ");
}

function mobileNavClass(active: boolean): string {
  return [
    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 transition-colors",
    active ? "text-chalk" : "text-faint hover:text-mist",
  ].join(" ");
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-raised">
        <BeaconIcon className="h-4.5 w-4.5 text-signal" />
      </span>
      <span>
        <span className="block font-display text-lg font-bold leading-none tracking-tight text-chalk">
          bSafe
        </span>
        <span className="mt-1 block font-mono text-[10px] tracking-[0.2em] text-faint">
          SILENT&nbsp;SOS
        </span>
      </span>
    </div>
  );
}

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  icon: ReactNode;
  badge?: string;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const contacts = useContacts();

  const count = contacts.data?.length ?? 0;
  const isAdmin = Boolean(profile.data?.isAdmin ?? user?.isAdmin);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const navItems: NavItem[] = [
    { href: "/", label: "SOS", exact: true, icon: <BeaconIcon className="h-4 w-4 shrink-0" /> },
    {
      href: "/contacts",
      label: "Contacts",
      icon: <UsersIcon className="h-4 w-4 shrink-0" />,
      badge: contacts.data ? String(count) : "…",
    },
    { href: "/me", label: "Profile", icon: <UserIcon className="h-4 w-4 shrink-0" /> },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: <ShieldIcon className="h-4 w-4 shrink-0" /> }]
      : []),
  ];

  const mobileNavItems = [
    { href: "/", label: "SOS", exact: true, icon: <BeaconIcon className="h-5 w-5" /> },
    { href: "/contacts", label: "CONTACTS", icon: <UsersIcon className="h-5 w-5" /> },
    { href: "/me", label: "PROFILE", icon: <UserIcon className="h-5 w-5" /> },
    ...(isAdmin ? [{ href: "/admin", label: "ADMIN", icon: <ShieldIcon className="h-5 w-5" /> }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-night text-chalk lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-night/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          onClick={handleSignOut}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-mist transition-colors hover:border-signal/60 hover:text-signal-soft"
        >
          <LogOutIcon className="h-4 w-4" />
          <span className="sr-only">Sign out {user?.email}</span>
        </button>
      </header>

      <aside className="hidden w-64 shrink-0 flex-col justify-between gap-6 border-r border-line/70 bg-deep/40 p-5 lg:flex">
        <div className="space-y-8">
          <Brand />
          <nav className="space-y-1" aria-label="Primary">
            <p className="eyebrow mb-2 px-3">Menu</p>
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href, Boolean(item.exact));
              return (
                <Link key={item.href} href={item.href} className={navClass(active)}>
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-md border border-line bg-deep px-1.5 py-0.5 font-mono text-xs text-mist">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <SosMark className="h-3 w-full text-line-bright" />
          <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-raised font-display text-sm font-semibold text-mist">
              {(profile.data?.name ?? user?.name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-chalk">
                {profile.data?.name ?? user?.name ?? "…"}
              </p>
              <p className="truncate font-mono text-[11px] text-faint">{user?.email}</p>
            </div>
          </div>
          {profile.isError && (
            <p className="font-mono text-[11px] leading-relaxed text-caution">
              Profile sync failed — try signing in again.
            </p>
          )}
          <button
            onClick={handleSignOut}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-mist transition-colors hover:border-signal/60 hover:text-signal-soft"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10">{children}</main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line/70 bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {mobileNavItems.map((item) => {
          const active = isActivePath(pathname, item.href, Boolean(item.exact));
          return (
            <Link key={item.href} href={item.href} className={mobileNavClass(active)}>
              <span
                aria-hidden
                className={`absolute top-0 h-0.5 w-8 rounded-full ${active ? "bg-signal" : "bg-transparent"}`}
              />
              {item.icon}
              <span className="font-mono text-[10px] tracking-[0.14em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
