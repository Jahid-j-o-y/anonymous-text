"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("anonymous_text_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("anonymous_text_theme", nextTheme);
    } catch (_) {}

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isDark = !mounted ? true : theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative p-2 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
        isDark
          ? "bg-slate-900/80 hover:bg-slate-800 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/40"
          : "bg-white/90 hover:bg-white border-emerald-500/30 text-emerald-600 shadow-md shadow-emerald-600/10"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-emerald-400 hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-emerald-600 hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
}
