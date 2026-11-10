"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, User } from "lucide-react";
import { useToast } from "@/components/ToastProvider.jsx";
import ThemeToggle from "@/components/ThemeToggle.jsx";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Please enter your username/email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed. Check your credentials.");
        return;
      }

      toast.success(`Welcome back, ${data.user.fullName}!`);

      if (data.user.role === "admin") {
        router.push("/admin/reports");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      toast.error("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-screen">
      {/* Top Right Corner Dark/Light Mode Switch */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-40">
        <ThemeToggle />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Brand Header with logo.png */}
          <div className="text-center mb-6">
            <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-xl shadow-emerald-500/20 mb-4 transform hover:scale-105 transition-transform duration-300 motion-reduce:transform-none border-2 border-emerald-500/30">
              <Image
                src="/logo.png"
                alt="Anonymous Text Logo"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Anonymous <span className="text-emerald-500 dark:text-emerald-400">Text</span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-700 dark:text-emerald-300 font-medium">
              Say it honestly. Stay anonymous.
            </p>
          </div>

          {/* Frosted Glass Login Card */}
          <div className="frosted-glass p-6 sm:p-8 rounded-3xl shadow-xl transition-colors duration-200">
            <h2 className="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-6">
              Sign In to Your Space
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder=""
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-pill-gradient py-3.5 px-6 flex items-center justify-center gap-2 text-base font-semibold shadow-lg"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/register"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold focus:outline-none focus:underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
