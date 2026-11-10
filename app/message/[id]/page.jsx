"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar.jsx";
import PaperNote from "@/components/PaperNote.jsx";
import Modal from "@/components/Modal.jsx";
import {
  ArrowLeft,
  Reply,
  Trash2,
  Flag,
  UserX,
  Send,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider.jsx";

export default function MessageViewPage({ params }) {
  const unwrappedParams = use(params);
  const messageId = unwrappedParams.id;

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingSender, setBlockingSender] = useState(false);

  const [deletingMessage, setDeletingMessage] = useState(false);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function fetchMessage() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        const res = await fetch(`/api/messages/${messageId}`);
        if (!res.ok) {
          toast.error("Message not found or unauthorized");
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        setMessage(data.message);
      } catch (err) {
        console.error("Message fetch error:", err);
        toast.error("Error loading message");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchMessage();
  }, [messageId, router, toast]);

  // Handle Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error("Reply content cannot be empty");
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/messages/${messageId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send reply");
        return;
      }

      toast.success("Anonymous reply delivered!");
      setReplyContent("");
      setShowReply(false);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle Report
  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for the report");
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/messages/${messageId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason.trim(),
          alsoBlockSender: alsoBlock,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to report message");
        return;
      }

      toast.success(data.message || "Report submitted for moderation");
      setShowReport(false);
      setReportReason("");
      setAlsoBlock(false);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Handle Block Sender
  const handleBlockSender = async () => {
    setBlockingSender(true);
    try {
      const res = await fetch(`/api/messages/${messageId}/block`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to block sender");
        return;
      }

      toast.success(data.message || "Sender has been blocked");
      setShowBlockModal(false);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBlockingSender(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    setDeletingMessage(true);
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete message");
        return;
      }

      toast.info("Message deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeletingMessage(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none focus:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inbox</span>
          </Link>
        </div>

        {loading ? (
          <div className="frosted-glass rounded-3xl p-12 max-w-2xl mx-auto text-center animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/3 mx-auto mb-4" />
            <div className="h-24 bg-slate-100 dark:bg-white/5 rounded mx-auto" />
          </div>
        ) : !message ? (
          <div className="text-center py-12 text-slate-500">
            Message not found
          </div>
        ) : (
          <div className="space-y-8">
            {/* The Cream Paper Note */}
            <PaperNote message={message} />

            {/* Action Bar */}
            <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-3 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-lg backdrop-blur-md transition-colors duration-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    if (message.isGuest) {
                      toast.info(
                        "This note was sent by an anonymous web visitor without an account. Replies can only be delivered to registered users."
                      );
                      return;
                    }
                    setShowReply(true);
                  }}
                  className="btn-pill-gradient px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  <Reply className="w-4 h-4" />
                  <span>
                    {message.isGuest ? "Reply (Guest Note)" : "Reply Anonymously"}
                  </span>
                </button>

                <button
                  onClick={() => setShowReport(true)}
                  className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-100 hover:bg-amber-500/10 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 border border-slate-200 dark:border-white/10 hover:border-amber-500/30 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>

                <button
                  onClick={() => setShowBlockModal(true)}
                  className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-100 hover:bg-rose-500/10 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-white/10 hover:border-rose-500/30 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block Sender</span>
                </button>
              </div>

              <button
                onClick={handleDelete}
                disabled={deletingMessage}
                className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-100 hover:bg-rose-500/20 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 hover:border-rose-500/30 transition-all inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        <Modal
          isOpen={showReply}
          onClose={() => setShowReply(false)}
          title="Send Anonymous Reply"
        >
          <form onSubmit={handleSendReply} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your reply will be sent straight to whoever sent you this note.
              They will not know who you are.
            </p>
            <div className="relative">
              <textarea
                rows={4}
                required
                maxLength={500}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your anonymous reply..."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm leading-relaxed"
              />
              <span className="block text-right text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                {replyContent.length} / 500
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReply(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                className="btn-pill-gradient px-5 py-2 text-xs font-semibold inline-flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReply ? "Sending..." : "Send Reply"}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Report Modal */}
        <Modal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          title="Report Inappropriate Content"
        >
          <form onSubmit={handleSendReport} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Help us keep the community safe. Moderators will review this note
              and take disciplinary action if warranted.
            </p>

            <div>
              <label
                htmlFor="reason"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Reason for Report
              </label>
              <textarea
                id="reason"
                rows={3}
                required
                maxLength={255}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe why this note violates community guidelines (harassment, threats, hate speech, etc.)..."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm leading-relaxed"
              />
              <span className="block text-right text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                {reportReason.length} / 255
              </span>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-white/20 bg-white dark:bg-white/10"
              />
              <span className="text-xs text-slate-700 dark:text-slate-200">
                Also block this sender from messaging me again
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReport || !reportReason.trim()}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs font-semibold hover:from-amber-500 hover:to-rose-500 transition-all inline-flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{submittingReport ? "Submitting..." : "Submit Report"}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Block Sender Modal */}
        <Modal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          title="Block Sender"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
              <p className="leading-relaxed">
                You will block this user from sending you any future messages or
                replies. Their identity remains anonymous to you.
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to block the sender of this note?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockSender}
                disabled={blockingSender}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-600 to-red-700 text-white text-xs font-semibold hover:from-rose-500 hover:to-red-600 transition-all inline-flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>{blockingSender ? "Blocking..." : "Confirm Block"}</span>
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
