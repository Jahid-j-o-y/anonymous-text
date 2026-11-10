"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  UserX,
  RefreshCw,
  Shield,
  Sparkles,
  ArrowRight,
  Radio,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar.jsx";
import ThemeToggle from "@/components/ThemeToggle.jsx";
import { useToast } from "@/components/ToastProvider.jsx";

export default function LiveChatPage() {
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState("idle"); // "idle" | "searching" | "chatting"
  const [participantId, setParticipantId] = useState("");
  const [myAlias, setMyAlias] = useState("You");
  const [partnerAlias, setPartnerAlias] = useState("Stranger");
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);

  const messagesEndRef = useRef(null);
  const toast = useToast();

  // Initialize or retrieve anonymous participant ID
  useEffect(() => {
    let pid = sessionStorage.getItem("anonymous_chat_pid");
    if (!pid) {
      pid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("anonymous_chat_pid", pid);
    }
    setParticipantId(pid);

    // Check optional authenticated user
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling loop when in "searching" stage
  useEffect(() => {
    let interval = null;
    if (stage === "searching" && participantId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/chat/poll-queue?participantId=${participantId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "matched" && data.roomId) {
              setRoomId(data.roomId);
              setMyAlias(data.alias || "You");
              setPartnerAlias(data.partnerAlias || "Stranger");
              setPartnerLeft(false);
              setStage("chatting");
            }
          }
        } catch (e) {
          console.error("Queue poll error:", e);
        }
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, participantId]);

  // Polling loop when in "chatting" stage
  useEffect(() => {
    let interval = null;
    if (stage === "chatting" && roomId && participantId) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(
            `/api/chat/${roomId}?participantId=${participantId}`
          );
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
            if (data.status === "ended") {
              setPartnerLeft(true);
            }
          }
        } catch (e) {
          console.error("Room poll error:", e);
        }
      };

      fetchMessages();
      interval = setInterval(fetchMessages, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, roomId, participantId]);

  // Join Matchmaking Queue
  const handleStartMatchmaking = async () => {
    setStage("searching");
    setMessages([]);
    setPartnerLeft(false);
    try {
      const res = await fetch("/api/chat/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to join live matchmaking");
        setStage("idle");
        return;
      }

      setMyAlias(data.alias || "You");

      if (data.status === "matched" && data.roomId) {
        setRoomId(data.roomId);
        setPartnerAlias(data.partnerAlias || "Stranger");
        setStage("chatting");
        toast.success("Matched with a stranger! Say hello 👋");
      }
    } catch {
      toast.error("Network error while connecting to chat");
      setStage("idle");
    }
  };

  // Send Message in Active Room
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || !roomId || sendingMessage) return;

    if (trimmed.length > 500) {
      toast.error("Message exceeds 500 characters");
      return;
    }

    setSendingMessage(true);
    setInputMessage("");

    // Optimistic UI append
    const tempMsg = {
      id: `temp_${Date.now()}`,
      senderAlias: myAlias,
      isMe: true,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/chat/${roomId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, content: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        // Remove optimistic message if rejected
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSendingMessage(false);
    }
  };

  // Leave / Skip Chat
  const handleLeaveChat = async () => {
    if (roomId) {
      try {
        await fetch(`/api/chat/${roomId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
      } catch {}
    }
    setRoomId(null);
    setStage("idle");
    setMessages([]);
    setPartnerLeft(false);
  };

  // Skip to next partner
  const handleNextStranger = async () => {
    if (roomId) {
      try {
        await fetch(`/api/chat/${roomId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
      } catch {}
    }
    handleStartMatchmaking();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {user ? (
        <Navbar user={user} />
      ) : (
        <header className="relative z-30 border-b border-emerald-500/15 dark:border-white/10 bg-white/80 dark:bg-[#071011]/85 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
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
              Anonymous <span className="text-emerald-500">Text</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/register"
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
            >
              Sign Up
            </Link>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* STAGE 1: IDLE / LANDING SCREEN */}
        {stage === "idle" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md mx-auto frosted-glass p-8 sm:p-10 rounded-3xl shadow-2xl text-center space-y-6">
              <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/25">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#0c191a] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Radio className="w-9 h-9 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Random 1-on-1 Matching</span>
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Live Anonymous Chat
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Connect instantly with a random stranger. Completely private,
                  zero profile exposure, and conversations automatically vanish
                  when you leave.
                </p>
              </div>

              {/* Privacy highlights */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold block">Total Privacy</span>
                  <p className="text-[11px] text-slate-500">
                    Real identity is never revealed.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold block">Safe & Filtered</span>
                  <p className="text-[11px] text-slate-500">
                    Offensive words blocked live.
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartMatchmaking}
                className="w-full btn-pill-gradient py-3.5 px-6 flex items-center justify-center gap-2 text-base font-semibold shadow-lg shadow-emerald-500/25"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Start Live Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: SEARCHING / MATCHMAKING RADAR */}
        {stage === "searching" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm mx-auto frosted-glass p-8 sm:p-10 rounded-3xl shadow-2xl text-center space-y-6">
              {/* Radar pulse animation */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Radio className="w-7 h-7" />
                </div>
              </div>

              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Looking for a Partner...
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Searching for someone online to pair with you. Please wait a
                  moment!
                </p>
              </div>

              <button
                onClick={() => setStage("idle")}
                className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
              >
                Cancel Search
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: CHATTING (MESSENGER-STYLE INTERFACE) */}
        {stage === "chatting" && (
          <div className="flex-1 flex flex-col frosted-glass rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl h-[78vh] min-h-[500px]">
            {/* Messenger Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold text-sm">
                  {partnerAlias.charAt(0)}
                  {!partnerLeft && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                <div>
                  <h3 className="font-heading font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                    {partnerAlias}
                  </h3>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    {!partnerLeft ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected & Chatting</span>
                      </>
                    ) : (
                      <span className="text-rose-500 font-semibold">
                        Disconnected
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextStranger}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5 transition-all"
                  title="Disconnect and find someone else"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Next Stranger</span>
                </button>

                <button
                  onClick={handleLeaveChat}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 inline-flex items-center gap-1 transition-all"
                  title="Leave chat"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              </div>
            </div>

            {/* Messages Area (Messenger Style Scroll) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
              {messages.map((msg, i) => {
                if (msg.isSystem) {
                  return (
                    <div key={i} className="flex justify-center my-2">
                      <span className="px-3.5 py-1 rounded-full text-[11px] bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-white/10">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id || i}
                    className={`flex flex-col ${
                      msg.isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 mb-1 px-1 font-semibold">
                      {msg.isMe ? myAlias : msg.senderAlias}
                    </span>

                    <div
                      className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                        msg.isMe
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    <span className="text-[9px] text-slate-600 dark:text-slate-300 mt-1 px-1 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}

              {/* Partner left notice */}
              {partnerLeft && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center my-4 space-y-2">
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                    {partnerAlias} has left the conversation.
                  </p>
                  <button
                    onClick={handleNextStranger}
                    className="btn-pill-gradient px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Find Another Stranger</span>
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Messenger Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center gap-2"
            >
              <input
                type="text"
                disabled={partnerLeft}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  partnerLeft
                    ? "Chat has ended. Find a new partner above!"
                    : `Message ${partnerAlias}... (Press Enter to send)`
                }
                maxLength={500}
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm transition-all"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sendingMessage || partnerLeft}
                className="btn-pill-gradient p-2.5 sm:px-5 sm:py-2.5 rounded-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

