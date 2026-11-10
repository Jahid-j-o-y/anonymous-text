"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar.jsx";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Trash2,
  UserX,
  Clock,
  User,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils.js";
import { useToast } from "@/components/ToastProvider.jsx";

export default function AdminReportsPage() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();
  const toast = useToast();

  const loadReports = async () => {
    setLoading(true);
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/");
        return;
      }
      const userData = await userRes.json();
      if (userData.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setUser(userData.user);

      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Admin reports load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [router]);

  const handleAction = async (reportId, action) => {
    setProcessingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }

      toast.success(data.message || "Report updated");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Moderation</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              Pending Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Review flagged anonymous messages. This is the only place sender
              identities are disclosed for moderation.
            </p>
          </div>

          <button
            onClick={loadReports}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="frosted-glass p-6 rounded-2xl animate-pulse space-y-4"
              >
                <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-1/4" />
                <div className="h-16 bg-slate-100 dark:bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="frosted-glass rounded-3xl p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-300">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              There are no pending reports waiting for moderation right now.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const isProcessing = processingId === report.id;
              return (
                <div
                  key={report.id}
                  className="frosted-glass rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 transition-colors duration-200"
                >
                  {/* Top Bar: Timestamp and Sender badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                        Pending Review
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    {/* Sender Identity Display */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs">
                      <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-slate-700 dark:text-slate-300">Message Sender:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        @{report.senderUsername}
                      </span>
                      {report.senderIsBlocked && (
                        <span className="ml-1 text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 px-1.5 py-0.2 rounded">
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Content & Report Reason */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Offending Message Box */}
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Reported Message Content
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-100 font-serif leading-relaxed italic break-words">
                        &ldquo;{report.messageContent}&rdquo;
                      </p>
                      {report.isMessageDeleted && (
                        <span className="inline-block text-[11px] text-amber-600 dark:text-amber-400">
                          (Message currently soft-deleted)
                        </span>
                      )}
                    </div>

                    {/* Report Reason Box */}
                    <div className="p-4 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-800/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                          Report Reason
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Reporter: @{report.reporterUsername}
                        </span>
                      </div>
                      <p className="text-sm text-rose-950 dark:text-rose-100 leading-relaxed break-words">
                        {report.reason}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                    {/* Dismiss */}
                    <button
                      onClick={() => handleAction(report.id, "dismiss")}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Dismiss Report</span>
                    </button>

                    {/* Delete Message */}
                    <button
                      onClick={() => handleAction(report.id, "delete_message")}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-200 border border-amber-500/30 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Delete Message</span>
                    </button>

                    {/* Block Sender Account */}
                    <button
                      onClick={() => handleAction(report.id, "block_sender")}
                      disabled={isProcessing || report.senderIsBlocked}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-md transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>
                        {report.senderIsBlocked
                          ? "Sender Already Blocked"
                          : "Block Sender Account"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
