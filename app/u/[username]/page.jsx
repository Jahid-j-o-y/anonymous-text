"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Shield,
  Dices,
  CheckCircle2,
  ArrowRight,
  User,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider.jsx";
import ThemeToggle from "@/components/ThemeToggle.jsx";

const PROMPTS = [
  "What is one thing you appreciate about me?",
  "Be honest: what's your first impression of me?",
  "What advice do you think I need to hear?",
  "Ask me anything you've always wondered about!",
  "Tell me a secret or confession!",
  "What is my biggest strength?",
];

export default function PublicUserMessagePage({ params }) {
  const unwrappedParams = use(params);
  const username = unwrappedParams.username;

  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/messages/public/${username}`);
        if (!res.ok) {
          setProfile(null);
        } else {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  const handlePickRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * PROMPTS.length);
    setContent(PROMPTS[randomIndex]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (content.length > 500) {
      toast.error("Message exceeds 500 characters limit");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/messages/public/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to deliver message");
        return;
      }

      setSentSuccess(true);
      setContent("");
      toast.success("Anonymous note delivered!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const charCount = content.length;
  const isNearLimit = charCount > 450;
  const isOverLimit = charCount > 500;

  return (
    <div className="flex-1 flex flex-col relative min-h-screen">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="relative z-30 border-b border-emerald-500/15 dark:border-white/10 bg-white/80 dark:bg-[#071011]/85 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Anonymous{" "}
            <span className="text-emerald-500 dark:text-emerald-400">Text</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/register"
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:inline-block"
          >
            Get Your Own Link
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg mx-auto">
          {loading ? (
            <div className="frosted-glass rounded-3xl p-10 text-center animate-pulse">
              <div className="w-20 h-20 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
              <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-1/3 mx-auto mb-2" />
              <div className="h-32 bg-slate-100 dark:bg-white/5 rounded mx-auto" />
            </div>
          ) : !profile ? (
            <div className="frosted-glass rounded-3xl p-10 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                <User className="w-8 h-8" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-2">
                User Not Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                The user @{username} doesn&apos;t exist or is not available.
              </p>
              <Link
                href="/"
                className="btn-pill-gradient px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
              >
                <span>Go to Homepage</span>
              </Link>
            </div>
          ) : sentSuccess ? (
            /* Sent Success State */
            <div className="frosted-glass rounded-3xl p-8 sm:p-10 text-center shadow-xl animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5 text-emerald-500 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Note Delivered! 🎉
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                Your message has been anonymously dropped into @{profile.username}&apos;s
                inbox. They won&apos;t know who sent it!
              </p>

              <div className="space-y-3 max-w-xs mx-auto">
                <button
                  onClick={() => setSentSuccess(false)}
                  className="w-full px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white text-sm font-semibold transition-all"
                >
                  Send Another Note
                </button>

                <Link
                  href="/register"
                  className="w-full btn-pill-gradient py-3 px-5 flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-md"
                >
                  <span>Get Your Own NGL Link</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* NGL-Style Message Card */
            <div className="frosted-glass rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-200">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#0c191a] flex items-center justify-center text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Send Anonymous Note</span>
                  </div>
                  <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                    @{profile.username}
                  </h1>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSend} className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Need inspiration?
                  </span>
                  <button
                    type="button"
                    onClick={handlePickRandomPrompt}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Dice a Question</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={5}
                    required
                    maxLength={500}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Send @${profile.username} an honest, anonymous message...`}
                    className="w-full p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm transition-all resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-1 px-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span>100% Anonymous</span>
                    </span>
                    <span
                      className={`text-xs font-mono font-medium ${
                        isOverLimit
                          ? "text-rose-500"
                          : isNearLimit
                          ? "text-amber-500"
                          : "text-slate-400"
                      }`}
                    >
                      {charCount} / 500
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending || isOverLimit || !content.trim()}
                  className="w-full btn-pill-gradient py-3.5 px-6 flex items-center justify-center gap-2 text-base font-semibold shadow-lg shadow-emerald-600/20"
                >
                  {sending ? (
                    <span>Sending anonymously...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Anonymous Message</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 text-center">
                <Link
                  href="/register"
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-medium transition-colors"
                >
                  Want your own link to receive anonymous notes?{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold underline">
                    Join free
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

