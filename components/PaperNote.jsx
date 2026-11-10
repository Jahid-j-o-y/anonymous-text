import React from "react";
import { formatDate } from "@/lib/utils.js";
import { MessageSquareReply, Sparkles } from "lucide-react";

export default function PaperNote({ message }) {
  if (!message) return null;

  return (
    <div className="relative mx-auto w-full max-w-2xl transform transition-all duration-300 motion-reduce:transform-none">
      {/* Subtle paper shadow layers */}
      <div className="absolute inset-0 bg-black/40 rounded-3xl blur-xl transform translate-y-3" />
      <div className="absolute inset-0 bg-amber-950/20 rounded-3xl transform rotate-1 scale-[0.99] translate-y-1" />

      {/* Main Cream Paper Note */}
      <div className="relative bg-[#fbf7ef] text-[#2d241e] rounded-3xl p-6 sm:p-10 border border-[#e8dec8] shadow-2xl overflow-hidden">
        {/* Subtle decorative paper watermark */}
        <div className="absolute top-4 right-4 text-[#8a7a6c]/20 select-none pointer-events-none">
          <Sparkles className="w-16 h-16 transform rotate-12" />
        </div>

        {/* Paper Header: Date & Anonymous indicator */}
        <div className="flex items-center justify-between border-b border-[#e5dcce] pb-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7a6b5e]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#9f580a]" />
            <span>Anonymous Note</span>
          </div>
          <span className="text-xs text-[#8c7e73] font-mono">
            {formatDate(message.createdAt)}
          </span>
        </div>

        {/* If this was a reply to an earlier note, display parent note context quote */}
        {message.parentMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#f2ebd9] border-l-4 border-violet-600 text-xs text-[#52453c] italic space-y-1">
            <div className="flex items-center gap-1.5 font-sans font-semibold text-violet-900 not-italic">
              <MessageSquareReply className="w-3.5 h-3.5" />
              <span>In reply to previous note:</span>
            </div>
            <p className="line-clamp-3 font-serif">
              &ldquo;{message.parentMessage.content}&rdquo;
            </p>
          </div>
        )}

        {/* Main note message content with serif font */}
        <div className="font-heading font-serif text-lg sm:text-2xl leading-relaxed text-[#231a14] whitespace-pre-wrap break-words min-h-[140px]">
          {message.content}
        </div>

        {/* Paper Footer with stationery motif */}
        <div className="mt-8 pt-4 border-t border-[#ebd8] flex items-center justify-between text-xs text-[#9c8e82]">
          <span className="italic font-serif">Encrypted & Anonymous</span>
          <span className="tracking-widest uppercase font-mono text-[10px]">
            ID: {message.id.slice(-6)}
          </span>
        </div>
      </div>
    </div>
  );
}

