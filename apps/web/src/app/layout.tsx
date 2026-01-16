import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RSVP Reader",
  description: "Read anything faster with RSVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "antialiased",
          "bg-black",
          "min-h-screen",
          "flex",
          "flex-col",
        ].join(" ")}
      >
        <main className="flex-1 flex items-center justify-center px-4">
          {children}
        </main>

        <footer className="pb-6 pt-4 text-center text-xs text-zinc-600">
          Built by{" "}
          <a
            href="https://github.com/caaarlxs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            caaarlxs
          </a>
        </footer>
      </body>
    </html>
  );
}
