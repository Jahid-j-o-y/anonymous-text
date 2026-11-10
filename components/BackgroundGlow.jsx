export default function BackgroundGlow() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-300"
    >
      {/* Top emerald/teal radial glow */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[650px] sm:w-[950px] h-[550px] rounded-full bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl opacity-70 dark:opacity-40 motion-reduce:opacity-30" />

      {/* Bottom right cyan/mint glow */}
      <div className="absolute -bottom-[15%] -right-[10%] w-[500px] sm:w-[750px] h-[600px] rounded-full bg-gradient-to-tl from-cyan-500/15 via-emerald-400/10 to-transparent blur-3xl opacity-60 dark:opacity-35 motion-reduce:opacity-30" />

      {/* Center left subtle mint glow */}
      <div className="absolute top-[35%] -left-[15%] w-[450px] h-[450px] rounded-full bg-teal-600/10 blur-3xl opacity-50 dark:opacity-25" />
    </div>
  );
}
