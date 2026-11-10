"use client";

import React, { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  PenSquare,
  KeyRound,
  ShieldAlert,
  Users,
  LogOut,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { useToast } from "./ToastProvider.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.info("Logged out successfully");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAdmin = user?.role === "admin";

  const userLinks = [
    { href: "/dashboard", label: "Inbox", icon: Inbox },
    { href: "/chat", label: "Live Chat", icon: MessageCircle, live: true },
    { href: "/compose", label: "Compose", icon: PenSquare },
    { href: "/password", label: "Security", icon: KeyRound },
  ];

  const adminLinks = [
    { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
    { href: "/admin/users", label: "User Directory", icon: Users },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <header className="relative z-30 border-b border-emerald-500/15 dark:border-white/10 bg-white/80 dark:bg-[#071011]/85 backdrop-blur-xl sticky top-0 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand using logo.png */}
          <NextLink
            href={isAdmin ? "/admin/reports" : "/dashboard"}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-xl p-1"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200 motion-reduce:transform-none">
              <Image
                src="/logo.png"
                alt="Anonymous Text Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex items-center">
              <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Anonymous{" "}
                <span className="text-emerald-500 dark:text-emerald-400">
                  Text
                </span>
              </span>
              {isAdmin && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                  Admin
                </span>
              )}
            </div>
          </NextLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    isActive
                      ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/30 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{link.label}</span>
                  {link.live && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </NextLink>
              );
            })}
          </nav>

          {/* Right Controls: Theme Toggle, User badge, Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark/Light mode switch in top right corner */}
            <ThemeToggle />

            {/* User pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/20 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                @{user?.username || "user"}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 hover:border-rose-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
            </button>
          </div>

          {/* Mobile Right Controls: Theme Toggle & Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-emerald-500/20 dark:border-white/10 bg-white/95 dark:bg-[#0c191a]/95 px-4 pt-3 pb-5 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>@{user?.username}</span>
            </div>
            {isAdmin && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                Admin
              </span>
            )}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <NextLink
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-white border border-emerald-500/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{link.label}</span>
                {link.live && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                )}
              </NextLink>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            disabled={isLoggingOut}
            className="w-full mt-2 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
          >
            <LogOut className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      )}
    </header>
  );
}
