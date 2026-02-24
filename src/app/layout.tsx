import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "勤務時間管理",
  description: "インターン勤務時間・給与管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <header className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">
              勤務管理
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ダッシュボード
              </Link>
              <Link
                href="/records"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                勤務記録
              </Link>
              <Link
                href="/settings"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                設定
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
