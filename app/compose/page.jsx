"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar.jsx";
import { Send, Sparkles, Shield } from "lucide-react";
import { useToast } from "@/components/ToastProvider.jsx";

function ComposeForm() {
  const [user, setUser] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user?.role === "admin") {
            toast.error("Admins cannot send anonymous messages");
            router.push("/admin/reports");
          }
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      }
    }
    checkAuth();

    const toParam = searchParams.get("to");
    if (toParam) {
      setRecipient(toParam);
    }
  }, [router, searchParams, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedRecipient = recipient.trim();
    const trimmedContent = content.trim();

    if (!trimmedRecipient) {
      toast.error("Please enter a recipient username");
      return;
    }
    if (!trimmedContent) {
      toast.error("Please write a message");
      return;
    }
    if (trimmedContent.length > 500) {
      toast.error("Message exceeds 500 characters limit");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUsername: trimmedRecipient,
          content: trimmedContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        return;
      }

      toast.success("Message sent anonymously!");
      setContent("");
      router.push("/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const isNearLimit = charCount > 450;
  const isOverLimit = charCount > 500;

  return (
    <div className="flex-1 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>100% Anonymous Delivery</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Compose a Note
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto">
            Your identity is never attached to this note. The recipient will only
            see your words.
          </p>
        </div>

        {/* Compose Card */}
        <div className="frosted-glass p-6 sm:p-8 rounded-3xl shadow-xl transition-colors duration-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="recipient"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Send to (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-mono">
                  @
                </div>
                <input
                  id="recipient"
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="username"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="content"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Your Secret Message
                </label>
                <span
                  className={`text-xs font-mono font-medium ${
                    isOverLimit
                      ? "text-rose-500 dark:text-rose-400"
                      : isNearLimit
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {charCount} / 500
                </span>
              </div>
              <textarea
                id="content"
                rows={6}
                required
                maxLength={500}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your honest message here... Be constructive, kind, or candid."
                className="w-full p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm transition-all resize-y leading-relaxed"
              />
            </div>

            {/* Privacy notice banner */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Offensive or abusive language is automatically blocked to keep
                our university community respectful and safe.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || isOverLimit || !content.trim()}
              className="w-full btn-pill-gradient py-3.5 px-6 flex items-center justify-center gap-2 text-base font-semibold shadow-lg"
            >
              {loading ? (
                <span>Sending securely...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Anonymous Note</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Loading compose...
        </div>
      }
    >
      <ComposeForm />
    </Suspense>
  );
}
