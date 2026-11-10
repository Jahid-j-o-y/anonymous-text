"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar.jsx";
import {
  Users,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import { formatDate } from "@/lib/utils.js";
import { useToast } from "@/components/ToastProvider.jsx";

export default function AdminUsersPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const router = useRouter();
  const toast = useToast();

  const loadUsers = async (searchQuery = "") => {
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

      const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/admin/users${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Admin users load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [router]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(search);
  };

  const handleToggleBlock = async (targetUser) => {
    if (targetUser.id === user?.id) {
      toast.error("You cannot block your own admin account");
      return;
    }

    setTogglingId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/toggle-block`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update user");
        return;
      }

      toast.success(data.message);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isBlocked: data.isBlocked } : u
        )
      );
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>User Administration</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
              User Directory
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Manage accounts, view user status, and toggle system access.
            </p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full sm:w-72 relative"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, @user, email..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Users Table / Card list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="frosted-glass p-5 rounded-2xl animate-pulse flex items-center justify-between"
              >
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
                <div className="h-8 bg-slate-200 dark:bg-white/5 rounded w-20" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="frosted-glass rounded-2xl p-8 text-center border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
            No users found matching your search.
          </div>
        ) : (
          <div className="frosted-glass rounded-2xl overflow-hidden shadow-xl transition-colors duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200">
                <thead className="text-xs uppercase bg-slate-100/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      User
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {users.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isToggling = togglingId === u.id;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-emerald-500/[0.04] dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {u.fullName}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                            @{u.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              u.role === "admin"
                                ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                                : "bg-slate-200/60 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500/30"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.isBlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 italic">
                              Current Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleBlock(u)}
                              disabled={isToggling}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                                u.isBlocked
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {u.isBlocked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Unblock</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Block</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
