import "./globals.css";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider.jsx";
import BackgroundGlow from "@/components/BackgroundGlow.jsx";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata = {
  title: "Anonymous Text | Say it honestly. Stay anonymous.",
  description:
    "A private and safe anonymous messaging web app built for genuine feedback and honest questions.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('anonymous_text_theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#071011] text-slate-800 dark:text-slate-100 min-h-screen relative selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        <ToastProvider>
          <BackgroundGlow />
          <div className="relative z-10 min-h-screen flex flex-col">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
