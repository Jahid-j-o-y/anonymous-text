"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar.jsx";
import {
  Mail,
  MailOpen,
  Send,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Inbox as InboxIcon,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils.js";
import { useToast } from "@/components/ToastProvider.jsx";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        const msgRes = await fetch("/api/messages");
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const copyProfileLink = () => {
    if (!user) return;
    const url = `${window.location.origin}/u/${user.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public NGL link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="flex-1 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome & Share Banner */}
        <div className="relative overflow-hidden rounded-3xl frosted-glass p-6 sm:p-8 mb-8 shadow-xl transition-colors duration-200">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Your Anonymous Space</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Hey, {user ? user.fullName : "there"}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-lg leading-relaxed mb-3">
                Your received notes are private and anonymous. Share your public link
                on Instagram, WhatsApp, or Twitter so anyone can text you anonymously without needing an account!
              </p>
              {user && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                  <span className="text-slate-400">Public Link:</span>
                  <span>/u/{user.username}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={copyProfileLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Copy My Link</span>
                  </>
                )}
              </button>

              <Link
                href="/compose"
                className="btn-pill-gradient px-5 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Send a Note</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Inbox Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Inbox
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10">
                {messages.length} total
              </span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message List or Skeleton or Empty */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="frosted-glass p-5 rounded-2xl animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
                  <div className="space-y-2 flex-1 max-w-md">
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="frosted-glass rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-300">
              <InboxIcon className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">
              Your inbox is quiet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              You haven&apos;t received any anonymous notes yet. Share your username
              or link with your classmates and friends!
            </p>
            <button
              onClick={copyProfileLink}
              className="btn-pill-gradient px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link to Share</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {messages.map((msg) => (
              <Link
                key={msg.id}
                href={`/message/${msg.id}`}
                className={`group block frosted-glass frosted-glass-hover p-5 rounded-2xl border transition-all ${
                  !msg.isRead
                    ? "border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/10"
                    : "border-slate-200/80 dark:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Envelope icon */}
                    <div
                      className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        !msg.isRead
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                      }`}
                    >
                      {!msg.isRead ? (
                        <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <MailOpen className="w-5 h-5" />
                      )}

                      {/* Glowing dot for unread (cyan-green) */}
                      {!msg.isRead && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] border-2 border-white dark:border-[#071011]" />
                      )}
                    </div>

                    {/* Preview snippet */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm truncate leading-relaxed ${
                          !msg.isRead
                            ? "font-semibold text-slate-900 dark:text-white"
                            : "font-normal text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {msg.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTimeAgo(msg.createdAt)}</span>
                        {msg.parentId && (
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-medium">
                            Reply
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                    <span className="text-xs hidden sm:inline font-medium">
                      Open
                    </span>
                    <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform motion-reduce:transform-none" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
